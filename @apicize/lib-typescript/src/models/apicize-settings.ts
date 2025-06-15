import { ExecutionReportFormat } from "./execution-report-format"

/**
 * Format of application settings
 */
export interface ApicizeSettings {
    workbookDirectory: string
    lastWorkbookFileName?: string
    fontSize: number
    navigationFontSize: number,
    colorScheme: 'dark' | 'light'
    editorPanels: string
    recentWorkbookFileNames?: string[]
    pkceListenerPort: number | undefined
    alwaysHideNavTree: boolean
    showDiagnosticInfo: boolean
    reportFormat: ExecutionReportFormat
    editorIndentSize: number
    editorDetectExistingIndent: boolean
    editorCheckJsSyntax: boolean
}
