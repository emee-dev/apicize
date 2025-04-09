/**
 * Format of application settings
 */
export interface ApplicationSettings {
    workbookDirectory: string
    lastWorkbookFileName?: string
    fontSize: number
    navigationFontSize: number,
    colorScheme: 'dark' | 'light'
    editorPanels: string
    recentWorkbookFileNames?: string[]
    pkceListenerPort: number | undefined
    alwaysHideNavTree: boolean
}
