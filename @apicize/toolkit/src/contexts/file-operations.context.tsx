import { StoredGlobalSettings } from "@apicize/lib-typescript";
import { createContext, useContext } from "react";

export class FileOperationsStore {
    constructor(private readonly callbacks: {
        onNewWorkbook: () => Promise<void>,
        onOpenWorkbook: (fileName?: string, doUpdateSettings?: boolean) => Promise<void>,
        onSaveWorkbook: () => Promise<void>,
        onSaveWorkbookAs: () => Promise<void>,
        onOpenSshFile: (fileType: SshFileType) => Promise<string | null>,
        onOpenFile: () => Promise<string | null>,
        onLoadSettings: () => Promise<StoredGlobalSettings>,
        onRetrieveHelpTopic: (topic: string) => Promise<string>,
    }) {
    }

    /**
     * Load a new workbook into workspace
     */
    newWorkbook() {
        return this.callbacks.onNewWorkbook()
    }

    /**
     * Open workbook into workspace
     */
    openWorkbook(fileName?: string, doUpdateSettings?: boolean) {
        return this.callbacks.onOpenWorkbook(fileName, doUpdateSettings)
    }

    /**
     * Save workspace's workbook under existing file name
     */
    saveWorkbook() {
        return this.callbacks.onSaveWorkbook()
    }

    /**
     * Save workspace's workbook after prompting for file name
     */
    saveWorkbookAs() {
        return this.callbacks.onSaveWorkbookAs()
    }

    /**
     * Open a SSH file and retrieve its contents
     * @returns Base64 encoded file contents or null if file not selected
     */
    openSshFile(fileType: SshFileType) {
        return this.callbacks.onOpenSshFile(fileType)
    }

    /**
     * Open a file and retrieve its contents
     * @returns Base64 encoded file contents or null if file not selected
     */
    openFile() {
        return this.callbacks.onOpenFile()
    }

    /**
     * Returns global settings
     */
    loadSettings() {
        return this.callbacks.onLoadSettings()
    }

    retrieveHelpTopic(topic: string) {
        debugger
        return this.callbacks.onRetrieveHelpTopic(topic)
    }
}

export const FileOperationsContext = createContext<FileOperationsStore | null>(null)

export function useFileOperations() {
    const context = useContext(FileOperationsContext);
    if (! context) {
        throw new Error('useFileOperations must be used within a FileOperationsContext.Provider');
    }
    return context;
}

export enum SshFileType {
    PEM = 'PEM',
    Key = 'Key',
    PFX = 'PFX',
  }
  
