import { WorkbookProxy } from "../workbook/workbook-proxy"

/**
 * Format of application settings
 */
export interface StoredGlobalSettings {
    workbookDirectory: string
    lastWorkbookFileName?: string
    fontSize: number
    colorScheme: 'dark' | 'light'
    editorPanels: string
    recentWorkbookFileNames?: string[]
}
