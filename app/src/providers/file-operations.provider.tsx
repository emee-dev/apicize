import { ReactNode, useEffect, useRef } from "react";
import * as core from '@tauri-apps/api/core'
import * as dialog from '@tauri-apps/plugin-dialog'
import * as path from '@tauri-apps/api/path'
import { exists, readFile, readTextFile } from "@tauri-apps/plugin-fs"
import { base64Encode, FileOperationsContext, FileOperationsStore, SshFileType, ToastSeverity, useApicize, useFeedback, WorkspaceStore } from "@apicize/toolkit";
import { GetTitle, ApicizeSettings, Workspace, Persistence } from "@apicize/lib-typescript";
import { extname, join, resourceDir } from '@tauri-apps/api/path';


/**
 * Implementation of file opeartions via Tauri
 */
export function FileOperationsProvider({ activeSessionId, workspaceStore, children }: { activeSessionId: string, workspaceStore: WorkspaceStore, children?: ReactNode }) {

    const EXT = 'apicize';

    const feedback = useFeedback()
    const apicizeSettings = useApicize()

    const _sshPath = useRef('')
    const _bodyDataPath = useRef('')

    /**
     * Updates specified settings and saves
     * @param updates 
     */
    const saveSettings = async () => {
        try {
            const settingsToSave: ApicizeSettings = {
                workbookDirectory: apicizeSettings.workbookDirectory,
                lastWorkbookFileName: apicizeSettings.lastWorkbookFileName,
                fontSize: apicizeSettings.fontSize,
                navigationFontSize: apicizeSettings.navigationFontSize,
                colorScheme: apicizeSettings.colorScheme,
                editorPanels: apicizeSettings.editorPanels,
                recentWorkbookFileNames: apicizeSettings.recentWorkbookFileNames.length > 0
                    ? apicizeSettings.recentWorkbookFileNames
                    : undefined,
                pkceListenerPort: apicizeSettings.pkceListenerPort,
                alwaysHideNavTree: apicizeSettings.alwaysHideNavTree,
                showDiagnosticInfo: apicizeSettings.showDiagnosticInfo,
            }
            await core.invoke<ApicizeSettings>('save_settings', { settings: settingsToSave })
        } catch (e) {
            feedback.toast(`Unable to save settings: ${e}`, ToastSeverity.Error)
        }
    }

    /**
     * Return SSH path if available, otherwise, fall back to settings
     * @returns 
     */
    const getSshPath = async () => {
        if (_sshPath.current.length > 0) {
            if (await exists(_sshPath.current)) {
                return _sshPath.current
            }
        }
        const home = await path.homeDir()
        const openSshPath = await path.join(home, '.ssh')
        if (await exists(openSshPath)) {
            _sshPath.current = openSshPath
        } else {
            _sshPath.current = apicizeSettings.workbookDirectory
        }
        return _sshPath.current
    }

    /**
     * Returns the last path a file was retrieved from, defaulting to default workbook directory
     * @returns 
     */
    const getBodyDataPath = async () => {
        if (_bodyDataPath.current.length > 0) {
            if (await exists(_bodyDataPath.current)) {
                return _bodyDataPath.current
            }
        }

        const fileName = workspaceStore.fileName
        if (fileName && fileName.length > 0) {
            const base = await path.basename(fileName)
            let i = fileName.indexOf(base)
            if (i != -1) {
                _bodyDataPath.current = fileName.substring(0, i)
                return _bodyDataPath.current
            }
        }
        _bodyDataPath.current = apicizeSettings.workbookDirectory
        return _bodyDataPath.current
    }

    /**
     * Launches a new workspace
     * @returns 
     */
    const newWorkspace = async (openInNewWindow: boolean) => {
        if (!openInNewWindow && workspaceStore.dirty) {
            if (! await feedback.confirm({
                title: 'New Workbook',
                message: 'Are you sure you want to create a new workbook without saving changes?',
                okButton: 'Yes',
                cancelButton: 'No',
                defaultToCancel: true
            })) {
                return
            }
        }

        await core.invoke('new_workspace', { sessionId: activeSessionId, openInNewSession: openInNewWindow })
        feedback.toast('Created New Workbook', ToastSeverity.Success)
    }

    /**
     * Loads the specified workbook (if named), otherwise, prompts for workbook
     * @param defaultFileName 
     * @param doUpdateSettings 
     * @returns 
     */
    const openWorkspace = async (openInNewWindow: boolean, defaultFileName?: string) => {
        try {
            if (!openInNewWindow && workspaceStore.dirty) {
                if (! await feedback.confirm({
                    title: 'Open Workbook',
                    message: 'Are you sure you want to open a workbook without saving changes?',
                    okButton: 'Yes',
                    cancelButton: 'No',
                    defaultToCancel: true
                })) {
                    return
                }
            }
            let fileName = defaultFileName ?? null

            if ((fileName?.length ?? 0) === 0) {
                feedback.setModal(true)
                fileName = await dialog.open({
                    multiple: false,
                    title: 'Open Apicize Workbook',
                    defaultPath: apicizeSettings.workbookDirectory,
                    directory: false,
                    filters: [{
                        name: 'Apicize Files',
                        extensions: [EXT]
                    }]
                })
                feedback.setModal(false)
            }

            if (!fileName) return

            await core.invoke('open_workspace', { fileName, sessionId: activeSessionId, openInNewSession: openInNewWindow })
        } catch (e) {
            feedback.toastError(e)
        }
    }

    /**
     * Saves the current worspake under its current name
     * @returns 
     */
    const saveWorkspace = async () => {
        try {
            await core.invoke('save_workspace', {
                sessionId: activeSessionId
            })
            feedback.toast('Workbook saved', ToastSeverity.Success)
        } catch (e) {
            feedback.toastError(e)
        }
    }

    /**
     * Saves the current workbook after prompting for a file name
     * @returns 
     */
    const saveWorkbookAs = async () => {
        try {
            const saveStatus = await core.invoke<WorkspaceSaveStatus>('get_workspace_save_status', {
                sessionId: activeSessionId
            })
            if (saveStatus.anyInvalid) {
                if (! await feedback.confirm({
                    title: 'Save Workbook',
                    message: 'Your workspace has one or more errors, are you sure you want to save?',
                    okButton: 'Yes',
                    cancelButton: 'No',
                    defaultToCancel: true
                })) {
                    return
                }
            }

            if (saveStatus.warnOnWorkspaceCreds) {
                if (! await feedback.confirm({
                    title: 'Save Workbook',
                    message: 'Your workspace has authorizations or certifiations stored publicly in the workbook, which will be included if you share the workbook; are you sure you want to save?',
                    okButton: 'Yes',
                    cancelButton: 'No',
                    defaultToCancel: true
                })) {
                    return
                }
            }

            feedback.setModal(true)
            let fileName = await dialog.save({
                title: 'Save Apicize Workbook',
                defaultPath: saveStatus.fileName.length > 0
                    ? saveStatus.fileName : apicizeSettings.workbookDirectory,
                filters: [{
                    name: 'Apicize Files',
                    extensions: [EXT]
                }]
            })
            feedback.setModal(false)

            if ((typeof fileName !== 'string') || ((fileName?.length ?? 0) === 0)) {
                return
            }

            if (!fileName.endsWith(`.${EXT}`)) {
                fileName += `.${EXT}`
            }

            await core.invoke('save_workspace', {
                sessionId: activeSessionId,
                fileName,
            })
            feedback.toast('Workbook saved', ToastSeverity.Success)
        } catch (e) {
            feedback.toastError(e)
        }
    }

    const cloneWorkspace = async () => {
        try {
            workspaceStore.expandedItems
            workspaceStore.activeSelection?.id
            workspaceStore.activeSelection?.type

            await core.invoke('clone_workspace', {
                sessionId: activeSessionId,
                startupState: {
                    expandedItems: workspaceStore.expandedItems,
                    mode: workspaceStore.mode,
                    activeId: workspaceStore.activeSelection?.id,
                    activeType: workspaceStore.activeSelection?.type,
                    helpTopic: workspaceStore.helpTopic,
                }
            })
        } catch (e) {
            feedback.toastError(e)
        }
    }

    /**
     * Open SSH PEM, key or PFX file
     * @param fileType 
     * @returns base64 encoded string or null if no result
     */
    const openSsshFile = async (fileType: SshFileType) => {
        let defaultPath: string
        let title: string
        let extensions: string[]
        let extensionName: string

        switch (fileType) {
            case SshFileType.PEM:
                defaultPath = await getSshPath()
                title = 'SSL Certificate'
                extensions = ['cer', 'crt', 'pem']
                extensionName = 'Privacy Enhanced Mail Format (.pem)'
                break
            case SshFileType.Key:
                defaultPath = await getSshPath()
                title = 'Open Private Key'
                extensions = ['key', 'pem']
                extensionName = 'Private Key Files (*.key)'
                break
            case SshFileType.PFX:
                defaultPath = await getSshPath()
                title = 'Open PFX Key (.pfx, .p12)'
                extensions = ['pfx', 'p12']
                extensionName = 'Personal Information Exchange Format (*.pfx, *.pfx)'
                break
            default:
                throw new Error(`Invalid SSH file type: ${fileType}`)
        }

        feedback.setModal(true)
        const fileName = await dialog.open({
            multiple: false,
            title,
            defaultPath,
            directory: false,
            filters: [{
                name: extensionName,
                extensions
            }, {
                name: 'All Files',
                extensions: ['*']
            }]
        })
        feedback.setModal(false)

        if (!fileName) return null

        const baseName = await path.basename(fileName)
        let pathName = ''
        let i = fileName.indexOf(baseName)
        if (i !== -1) {
            pathName = (await path.dirname(fileName)).substring(0, i)
        }

        const data = base64Encode(await readFile(fileName))
        return data
    }

    /**
     * Open a data file and return its results
     * @returns base64 encoded string or null if no result
     */
    const openFile = async (): Promise<Uint8Array | null> => {
        feedback.setModal(true)
        const fileName = await dialog.open({
            multiple: false,
            title: 'Open File',
            defaultPath: await getBodyDataPath(),
            directory: false,
            filters: [{
                name: 'All Files',
                extensions: ['*']
            }]
        })
        feedback.setModal(false)

        if (!fileName) return null

        const baseName = await path.basename(fileName)
        let pathName = ''
        let i = fileName.indexOf(baseName)
        if (i !== -1) {
            pathName = (await path.dirname(fileName)).substring(0, i)
        }

        return await readFile(fileName)
    }

    /**
     * Open up the specified help topic
     * @param showTopic 
     * @returns Markdown help text loaded from file
     */
    const retrieveHelpTopic = async (showTopic: string): Promise<string> => {
        const helpFile = await join(await resourceDir(), 'help', `${showTopic}.md`)
        if (await exists(helpFile)) {
            let text = await readTextFile(helpFile)

            const helpDir = await join(await resourceDir(), 'help', 'images')

            // This is cheesy, but I can't think of another way to inject images from the React client
            let imageLink
            do {
                imageLink = text.match(/\:image\[(.*)\]/)
                if (imageLink && imageLink.length > 0 && imageLink.index) {
                    const imageFile = await join(helpDir, imageLink[1])
                    let replaceWith = ''
                    try {
                        const data = await readFile(imageFile)
                        const ext = await extname(imageFile)
                        replaceWith = `![](data:image/${ext};base64,${base64Encode(data)})`
                    } catch (e) {
                        throw new Error(`Unable to load ${imageFile} - ${e}`)
                    }
                    text = `${text.substring(0, imageLink.index)}${replaceWith}${text.substring(imageLink.index + imageLink[0].length)}`
                }
            } while (imageLink && imageLink.length > 0)
            return text
        } else {
            throw new Error(`Help topic "${showTopic}" not found at ${helpFile}`)
        }
    }
    const fileOpsStore = new FileOperationsStore({
        onNewWorkbook: newWorkspace,
        onOpenWorkbook: openWorkspace,
        onSaveWorkbook: saveWorkspace,
        onSaveWorkbookAs: saveWorkbookAs,
        onCloneWorkspace: cloneWorkspace,
        onOpenSshFile: openSsshFile,
        onOpenFile: openFile,
        onSaveSettings: saveSettings,
        onRetrieveHelpTopic: retrieveHelpTopic,
    })

    return (
        <FileOperationsContext.Provider value={fileOpsStore}>
            {children}
        </FileOperationsContext.Provider>
    )
}


export interface WorkspaceSaveStatus {
    dirty: boolean
    warnOnWorkspaceCreds: boolean
    anyInvalid: boolean
    fileName: string
    displayName: string
}