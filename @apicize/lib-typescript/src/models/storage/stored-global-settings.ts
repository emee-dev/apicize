import { WorkbookProxy } from "../workbook/workbook-proxy"

/**
 * Format of application settings
 */
export interface StoredGlobalSettings {
    workbookDirectory: string
    lastWorkbookFileName?: string
}
