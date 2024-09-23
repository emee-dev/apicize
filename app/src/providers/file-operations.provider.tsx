import { ReactNode, useRef } from "react";
import * as core from '@tauri-apps/api/core'
import * as dialog from '@tauri-apps/plugin-dialog'
import * as path from '@tauri-apps/api/path'
import { exists, readFile, readTextFile } from "@tauri-apps/plugin-fs"
import { base64Encode, FileOperationsContext, FileOperationsStore, SshFileType, ToastSeverity, useFeedback, WorkspaceStore } from "@apicize/toolkit";
import { StoredGlobalSettings, Workspace } from "@apicize/lib-typescript";
import { extname, join, resourceDir } from '@tauri-apps/api/path';

/**
 * Implementation of file opeartions via Tauri
 */
export function FileOperationsProvider({ store: workspaceStore, children }: { store: WorkspaceStore, children?: ReactNode }) {

    const EXT = 'apicize';

    const feedback = useFeedback()

    const _forceClose = useRef(false)
    const _settings = useRef<StoredGlobalSettings | undefined>()
    const _sshPath = useRef('')
    const _bodyDataPath = useRef('')

    /**
     * Loads or initializes global Apicize settings
     * @returns active settings
     */
    const loadSettings = async () => {
        if (_settings.current) return _settings.current

        let settings: StoredGlobalSettings
        try {
            settings = await core.invoke<StoredGlobalSettings>('open_settings')
        } catch (e) {
            // If unable to load settings, try and put into place some sensible defaults
            settings = {
                workbookDirectory: await path.join(await path.documentDir(), 'apicize'),
            }
            feedback.toast(`Unable to access settings: ${e}`, ToastSeverity.Error)
        }

        _settings.current = settings
        return _settings.current
    }

    /**
     * Updates specified settings and saves
     * @param updates 
     */
    const updateSettings = async (updates: {
        workbookDirectory?: string,
        lastWorkbookFileName?: string
    }) => {
        _settings.current = await loadSettings()

        // Build a new set of settings, including  in proxy / certificate information
        const newSettings = workspaceStore.getSettings(
            updates.workbookDirectory === undefined ? _settings.current.workbookDirectory : updates.workbookDirectory,
            updates.lastWorkbookFileName === undefined ? _settings.current.lastWorkbookFileName : updates.lastWorkbookFileName
        )

        try {
            await core.invoke<StoredGlobalSettings>('save_settings', { settings: newSettings })
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
        const settings = await loadSettings()
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
        const settings = await loadSettings()
        _bodyDataPath.current = settings.workbookDirectory
        return _bodyDataPath.current
    }

    /**
     * Launches a new workbook
     * @returns 
     */
    const newWorkbook = async () => {
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
    const openWorkbook = async (fileName?: string, doUpdateSettings?: boolean) => {
        const settings = await loadSettings()
        if (! doUpdateSettings) doUpdateSettings = true

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
                defaultPath: settings?.workbookDirectory,
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
            if (doUpdateSettings) {
                await updateSettings({ lastWorkbookFileName: fileName })
            }
            _forceClose.current = false
            feedback.toast(`Opened ${fileName}`, ToastSeverity.Success)
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    /**
     * Saves the current workbook under its current name
     * @returns 
     */
    const saveWorkbook = async () => {
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

            const workspaceToSave = workspaceStore.getWorkspace()
            await core.invoke('save_workspace', { workspace: workspaceToSave, path: workspaceStore.workbookFullName })
            await updateSettings({ lastWorkbookFileName: workspaceStore.workbookFullName })
            console.log('Triggering toast...')
            feedback.toast(`Saved ${workspaceStore.workbookFullName}`, ToastSeverity.Success)
            workspaceStore.updateSavedLocation(
                workspaceStore.workbookFullName,
                await getDisplayName(workspaceStore.workbookFullName)
            )
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

            const settings = await loadSettings()

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

            await updateSettings({ lastWorkbookFileName: fileName })
            feedback.toast(`Saved ${fileName}`, ToastSeverity.Success)
            workspaceStore.updateSavedLocation(
                fileName,
                await getDisplayName(fileName)
            )
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
        if(workspaceStore.lastWorkbookNotYetRequested()) {
            try {
                let settings = await loadSettings()
                if ((settings?.lastWorkbookFileName?.length ?? 0) > 0) {
                    await openWorkbook(settings.lastWorkbookFileName, false)
                }
            } catch (e) {
                feedback.toast(`${e}`, ToastSeverity.Error)
            }        
        }
    })()

    const fileOpsStore = new FileOperationsStore({
        onNewWorkbook: newWorkbook,
        onOpenWorkbook: openWorkbook,
        onSaveWorkbook: saveWorkbook,
        onSaveWorkbookAs: saveWorkbookAs,
        onOpenSshFile: openSsshFile,
        onOpenFile: openFile,
        onLoadSettings: loadSettings,
        onRetrieveHelpTopic: retrieveHelpTopic,
    })

    return (
        <FileOperationsContext.Provider value={fileOpsStore}>
            {children}
        </FileOperationsContext.Provider>
    )
}
