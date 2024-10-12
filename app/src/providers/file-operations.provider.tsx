import { ReactNode, useEffect, useRef } from "react";
import * as core from '@tauri-apps/api/core'
import * as dialog from '@tauri-apps/plugin-dialog'
import * as path from '@tauri-apps/api/path'
import { exists, readFile, readTextFile, copyFile, mkdir } from "@tauri-apps/plugin-fs"
import { base64Encode, FileOperationsContext, FileOperationsStore, SshFileType, ToastSeverity, useApicizeSettings, useFeedback, WorkspaceStore } from "@apicize/toolkit";
import { GetTitle, StoredGlobalSettings, Workspace } from "@apicize/lib-typescript";
import { extname, join, resourceDir } from '@tauri-apps/api/path';

/**
 * Implementation of file opeartions via Tauri
 */
export function FileOperationsProvider({ store: workspaceStore, children }: { store: WorkspaceStore, children?: ReactNode }) {

    const EXT = 'apicize';

    const feedback = useFeedback()
    const settings = useApicizeSettings()

    const _forceClose = useRef(false)
    const _defaultRequested = useRef(false)
    const _sshPath = useRef('')
    const _bodyDataPath = useRef('')

    /**
     * Loads or initializes global Apicize settings
     * @returns active settings
     */
    const loadSettings = async () => {
        let storedSettings: StoredGlobalSettings
        try {
            storedSettings = await core.invoke<StoredGlobalSettings>('open_settings')
        } catch (e) {
            // If unable to load settings, try and put into place some sensible defaults
            storedSettings = {
                workbookDirectory: await path.join(await path.documentDir(), 'apicize'),
                fontSize: 12,
                colorScheme: 'dark'
            }
            feedback.toast(`Unable to access settings: ${e}`, ToastSeverity.Error)
        }

        settings.lastWorkbookFileName = storedSettings.lastWorkbookFileName
        settings.workbookDirectory = storedSettings.workbookDirectory
        settings.fontSize = storedSettings.fontSize
        settings.colorScheme = storedSettings.colorScheme
    }

    /**
     * Updates specified settings and saves
     * @param updates 
     */
    const saveSettings = async () => {
        try {
            const settingsToSave: StoredGlobalSettings = {
                workbookDirectory: settings.workbookDirectory,
                lastWorkbookFileName: settings.lastWorkbookFileName,
                fontSize: settings.fontSize,
                colorScheme: settings.colorScheme
            }
            await core.invoke<StoredGlobalSettings>('save_settings', { settings: settingsToSave })
        } catch (e) {
            feedback.toast(`Unable to save settings: ${e}`, ToastSeverity.Error)
        }
    }

    /**
     * Get the base file name without extension or path
     * @param fileName 
     * @returns 
     */
    const getDisplayName = async (fileName: string) => {
        let base = await path.basename(fileName);
        const i = base.lastIndexOf('.');
        if (i !== -1) {
            base = base.substring(0, i);
        }
        return base;
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
            _sshPath.current = settings.workbookDirectory
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

        const fileName = workspaceStore.workbookFullName
        if (fileName && fileName.length > 0) {
            const base = await path.basename(fileName)
            let i = fileName.indexOf(base)
            if (i != -1) {
                _bodyDataPath.current = fileName.substring(0, i)
                return _bodyDataPath.current
            }
        }
        _bodyDataPath.current = settings.workbookDirectory
        return _bodyDataPath.current
    }

    /**
     * Launches a new workspace
     * @returns 
     */
    const newWorkspace = async () => {
        if (workspaceStore.dirty) {
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

        workspaceStore.newWorkspace()
        _forceClose.current = false
        feedback.toast('Created New Workbook', ToastSeverity.Success)
    }

    /**
     * Loads the specified workbook (if named), otherwise, prompts for workbook
     * @param fileName 
     * @param doUpdateSettings 
     * @returns 
     */
    const openWorkspace = async (fileName?: string, doUpdateSettings?: boolean) => {
        if (workspaceStore.dirty) {
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

        if ((fileName?.length ?? 0) === 0) {
            fileName = (await dialog.open({
                multiple: false,
                title: 'Open Apicize Workbook',
                defaultPath: settings.workbookDirectory,
                directory: false,
                filters: [{
                    name: 'Apicize Files',
                    extensions: [EXT]
                }]
            })) as any
        }

        if (!fileName) return

        try {
            const data: Workspace = await core.invoke('open_workspace', { path: fileName })
            const displayName = await getDisplayName(fileName)
            workspaceStore.loadWorkspace(data, fileName, displayName)
            settings.lastWorkbookFileName = fileName
            if (settings.dirty) {
                await saveSettings()
            }
            _forceClose.current = false
            feedback.toast(`Opened ${fileName}`, ToastSeverity.Success)
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    /**
     * Saves the current worspake under its current name
     * @returns 
     */
    const saveWorkspace = async () => {
        try {
            if (!(workspaceStore.workbookFullName && workspaceStore.workbookFullName.length > 0)) {
                return
            }

            if (workspaceStore.anyInvalid()) {
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

            if (workspaceStore.warnOnWorkspaceCreds) {
                const creds = workspaceStore.listWorkspaceCredentials()
                if (creds.length > 0) {
                    if (! await feedback.confirm({
                        title: 'Save Workbook',
                        message: `Your workspace has authorizations or certifiations stored directly in the workbook, which will be included if you share the workbook; are you sure you want to save?\n\n${creds.map(c => GetTitle(c)).join(', ')}`,
                        okButton: 'Yes',
                        cancelButton: 'No',
                        defaultToCancel: true
                    })) {
                        return
                    }
                    workspaceStore.warnOnWorkspaceCreds = false
                }
            }

            const workspaceToSave = workspaceStore.getWorkspace()
            await core.invoke('save_workspace', { workspace: workspaceToSave, path: workspaceStore.workbookFullName })
            feedback.toast(`Saved ${workspaceStore.workbookFullName}`, ToastSeverity.Success)
            workspaceStore.updateSavedLocation(
                workspaceStore.workbookFullName,
                await getDisplayName(workspaceStore.workbookFullName)
            )
            settings.lastWorkbookFileName = workspaceStore.workbookFullName
            if (settings.dirty) {
                await saveSettings()
            }
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    /**
     * Saves the current workbook after prompting for a file name
     * @returns 
     */
    const saveWorkbookAs = async () => {
        try {
            if (workspaceStore.anyInvalid()) {
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

            if (workspaceStore.warnOnWorkspaceCreds) {
                const creds = workspaceStore.listWorkspaceCredentials()
                if (creds.length > 0) {
                    if (! await feedback.confirm({
                        title: 'Save Workbook',
                        message: `Your workspace has authorizations or certifiations stored directly in the workbook, which will be included if you share the workbook; are you sure you want to save?\n\n${creds.map(c => GetTitle(c)).join(', ')}`,
                        okButton: 'Yes',
                        cancelButton: 'No',
                        defaultToCancel: true
                    })) {
                        return
                    }
                    workspaceStore.warnOnWorkspaceCreds = false
                }
            }
            
            let fileName = await dialog.save({
                title: 'Save Apicize Workbook',
                defaultPath: ((workspaceStore.workbookFullName?.length ?? 0) > 0)
                    ? workspaceStore.workbookFullName : settings.workbookDirectory,
                filters: [{
                    name: 'Apicize Files',
                    extensions: [EXT]
                }]
            })

            if ((typeof fileName !== 'string') || ((fileName?.length ?? 0) === 0)) {
                return
            }

            if (!fileName.endsWith(`.${EXT}`)) {
                fileName += `.${EXT}`
            }

            const workspaceToSave = workspaceStore.getWorkspace()
            await core.invoke('save_workspace', { workspace: workspaceToSave, path: fileName })

            feedback.toast(`Saved ${fileName}`, ToastSeverity.Success)
            workspaceStore.updateSavedLocation(
                fileName,
                await getDisplayName(fileName)
            )
            settings.lastWorkbookFileName = fileName
            if (settings.dirty) {
                await saveSettings()
            }
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
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
                title = 'Open Public Key (.pem)'
                extensions = ['pem']
                extensionName = 'Privacy Enhanced Mail Format (.pem)'
                break
            case SshFileType.Key:
                defaultPath = await getSshPath()
                title = 'Open Private Key (.key)'
                extensions = ['key']
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

        const fileName = (await dialog.open({
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
        })) as any

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
    const openFile = async () => {
        const fileName = (await dialog.open({
            multiple: false,
            title: 'Open File',
            defaultPath: await getBodyDataPath(),
            directory: false,
            filters: [{
                name: 'All Files',
                extensions: ['*']
            }]
        })) as any

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

    // Load if we have not 
    (async () => {
        await loadSettings()
        if (!_defaultRequested.current) {
            try {
                _defaultRequested.current = true
                if (settings.lastWorkbookFileName && (settings.lastWorkbookFileName?.length ?? 0) > 0) {
                    if (await exists(settings.lastWorkbookFileName)) {
                        await openWorkspace(settings.lastWorkbookFileName, false)
                    }
                } else {
                    if (! await exists(settings.workbookDirectory)) {
                        await mkdir(settings.workbookDirectory)
                        const demoFileSource = await join(await resourceDir(), 'help', `demo.apicize`)
                        const demoFileDest = await join(settings.workbookDirectory, `demo.apicize`)
                        await copyFile(demoFileSource, demoFileDest)
                        await openWorkspace(demoFileDest, true)
                    }
                }
            } catch (e) {
                feedback.toast(`${e}`, ToastSeverity.Error)
            }
        }
    })()

    const fileOpsStore = new FileOperationsStore({
        onNewWorkbook: newWorkspace,
        onOpenWorkbook: openWorkspace,
        onSaveWorkbook: saveWorkspace,
        onSaveWorkbookAs: saveWorkbookAs,
        onOpenSshFile: openSsshFile,
        onOpenFile: openFile,
        onRetrieveHelpTopic: retrieveHelpTopic,
        onSaveSettings: saveSettings
    })

    return (
        <FileOperationsContext.Provider value={fileOpsStore}>
            {children}
        </FileOperationsContext.Provider>
    )
}
