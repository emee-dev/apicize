/**
 * Format of application settings
 */
export interface ApplicationSettings {
    workbookDirectory: string
    lastWorkbookFileName?: string
    fontSize: number
    colorScheme: 'dark' | 'light'
    editorPanels: string
    recentWorkbookFileNames?: string[]
    pkceListenerPort: number | undefined
}
