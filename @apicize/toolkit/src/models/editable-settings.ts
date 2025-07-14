import { ApicizeSettings, ExecutionReportFormat } from '@apicize/lib-typescript';
import { SupportedColorScheme } from '@mui/material';
import { action, observable } from 'mobx';

export class EditableSettings {
    @observable accessor pendingChangeCtr = 0

    @observable accessor appName = 'Apicize'
    @observable accessor appVersion = ''

    @observable accessor workbookDirectory: string = ''
    @observable accessor lastWorkbookFileName: string | undefined
    @observable accessor fontSize = 12
    @observable accessor navigationFontSize = 12
    @observable accessor colorScheme: SupportedColorScheme = 'dark'
    @observable accessor editorPanels = ''
    @observable accessor recentWorkbookFileNames: string[] = []
    @observable accessor pkceListenerPort = 8080
    @observable accessor alwaysHideNavTree = false
    @observable accessor showDiagnosticInfo = false
    @observable accessor reportFormat = ExecutionReportFormat.JSON

    @observable accessor editorIndentSize = 3
    @observable accessor editorDetectExistingIndent = true
    @observable accessor editorCheckJsSyntax = true

    constructor(settings?: ApicizeSettings) {
        if (settings) {
            this.setValues(settings)
        }
    }

    public ctrlKey: string = 'Ctrl'

    private setValues(settings: ApicizeSettings) {
        this.workbookDirectory = settings.workbookDirectory
        this.lastWorkbookFileName = settings.lastWorkbookFileName
        this.fontSize = settings.fontSize
        this.navigationFontSize = settings.navigationFontSize
        this.colorScheme = settings.colorScheme
        this.editorPanels = settings.editorPanels
        this.recentWorkbookFileNames = settings.recentWorkbookFileNames?.slice(0, 10) ?? []
        this.pkceListenerPort = settings.pkceListenerPort ?? 8080
        this.alwaysHideNavTree = settings.alwaysHideNavTree
        this.showDiagnosticInfo = settings.showDiagnosticInfo
        this.reportFormat = settings.reportFormat
        this.editorIndentSize = settings.editorIndentSize
        this.editorDetectExistingIndent = settings.editorDetectExistingIndent
        this.editorCheckJsSyntax = settings.editorCheckJsSyntax
    }

    @action
    public update(settings: ApicizeSettings) {
        this.setValues(settings)
        this.pendingChangeCtr++
    }

    @action
    changeApp(name: string, version: string) {
        this.appName = name
        this.appVersion = version
    }

    setOs(os: string) {
        this.ctrlKey = os === 'macos' ? 'Cmd' : 'Ctrl'
    }


    @action
    public clearPendingChanges() {
        this.pendingChangeCtr = 0
    }

    @action
    public setWorkbookDirectory(newDirectory: string) {
        if (this.workbookDirectory !== newDirectory) {
            this.workbookDirectory = newDirectory
            this.pendingChangeCtr++
        }
    }

    @action
    public setLastWorkbookFileName(newLastWorkbookFileName: string | undefined) {
        if (this.lastWorkbookFileName != newLastWorkbookFileName) {
            this.lastWorkbookFileName = newLastWorkbookFileName
            this.pendingChangeCtr++
        }
    }

    @action
    public setRecentWorkbookFileNames(newRecentWorkbookFileNames: string[]) {
        if (this.recentWorkbookFileNames.join(';') != newRecentWorkbookFileNames.join(';')) {
            this.recentWorkbookFileNames = newRecentWorkbookFileNames.slice(0, 10)
            this.pendingChangeCtr++
        }
    }

    @action
    public setPkceListenerPort(value: number) {
        if (this.pkceListenerPort !== value) {
            this.pkceListenerPort = value
            this.pendingChangeCtr++
        }
    }

    @action setAlwaysHideNavTree(value: boolean) {
        if (this.alwaysHideNavTree !== value) {
            this.alwaysHideNavTree = value
            this.pendingChangeCtr++
        }
    }

    @action
    public addRecentWorkbookFileName(fileName: string) {
        const i = this.recentWorkbookFileNames.indexOf(fileName)
        if (i !== 0) {
            if (i !== -1) {
                this.recentWorkbookFileNames.splice(i, 1)
            }
            this.recentWorkbookFileNames = [fileName, ...this.recentWorkbookFileNames.slice(0, 10)]
            this.pendingChangeCtr++
        }
    }

    @action
    public removeRecentWorkbookFileName(fileName: string) {
        const i = this.recentWorkbookFileNames.indexOf(fileName)
        if (i !== 0) {
            if (i !== -1) {
                this.recentWorkbookFileNames.splice(i, 1)
            }
        }
    }

    @action
    public setFontSize(newFontSize: number) {
        if (this.fontSize != newFontSize) {
            this.fontSize = newFontSize
            this.pendingChangeCtr++
        }
    }

    @action
    public setNavigationFontSize(newFontSize: number) {
        if (this.navigationFontSize != newFontSize) {
            this.navigationFontSize = newFontSize
            this.pendingChangeCtr++
        }
    }

    @action
    public setColorScheme(newColorScheme: SupportedColorScheme) {
        if (this.colorScheme != newColorScheme) {
            this.colorScheme = newColorScheme
            this.pendingChangeCtr++
        }
    }

    @action
    public setEditorPanels(value: string) {
        this.editorPanels = value
    }

    @action
    public setShowDiagnosticInfo(value: boolean) {
        this.showDiagnosticInfo = value
        this.pendingChangeCtr++
    }

    @action setReportFormat(value: ExecutionReportFormat) {
        this.reportFormat = value
        this.pendingChangeCtr++
    }

    @action setEditorIndentSize(value: number) {
        this.editorIndentSize = value
        this.pendingChangeCtr++
    }

    @action setEditorDetectExistingIndent(value: boolean) {
        this.editorDetectExistingIndent = value
        this.pendingChangeCtr++
    }

    @action setEditorCheckJsSyntax(value: boolean) {
        this.editorCheckJsSyntax = value
        this.pendingChangeCtr++
    }
}
