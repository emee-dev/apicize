import { ApplicationSettings } from '@apicize/lib-typescript';
import { SupportedColorScheme } from '@mui/material';
import { action, observable } from 'mobx';
import { EditableItem, EditableState } from './editable';
import { EditableEntityType } from './workspace/editable-entity-type';

export class ApicizeSettings implements EditableItem {
    @observable accessor dirty = false

    public readonly id = 'Settings'
    public readonly name = 'Settings'
    public readonly state = EditableState.None;
    public readonly entityType = EditableEntityType.Settings;

    @observable accessor workbookDirectory: string = ''
    @observable accessor lastWorkbookFileName: string | undefined
    @observable accessor fontSize = 12
    @observable accessor colorScheme: SupportedColorScheme = 'dark'
    @observable accessor editorPanels = ''
    @observable accessor recentWorkbookFileNames: string[] = []
    @observable accessor pkceListenerPort = 8080

    constructor(settings: ApplicationSettings) {
        this.workbookDirectory = settings.workbookDirectory
        this.lastWorkbookFileName = settings.lastWorkbookFileName
        this.fontSize = settings.fontSize
        this.colorScheme = settings.colorScheme
        this.editorPanels = settings.editorPanels
        this.recentWorkbookFileNames = settings.recentWorkbookFileNames ?? []
        this.pkceListenerPort = settings.pkceListenerPort ?? 8080
    }

    @action
    public setDirty(value: boolean) {
        this.dirty = value
    }

    @action
    public setWorkbookDirectory(newDirectory: string) {
        if (this.workbookDirectory !== newDirectory) {
            this.workbookDirectory = newDirectory
            this.dirty = true
        }
    }

    @action
    public setLastWorkbookFileName(newLastWorkbookFileName: string | undefined) {
        if (this.lastWorkbookFileName != newLastWorkbookFileName) {
            this.lastWorkbookFileName = newLastWorkbookFileName
            this.dirty = true
        }
    }

    @action
    public setRecentWorkbookFileNames(newRecentWorkbookFileNames: string[]) {
        if (this.recentWorkbookFileNames.join(';') != newRecentWorkbookFileNames.join(';')) {
            this.recentWorkbookFileNames = newRecentWorkbookFileNames
            this.dirty = true
        }
    }

    @action
    public setPkceListenerPort(value: number) {
        if (this.pkceListenerPort !== value) {
            this.pkceListenerPort = value
            this.dirty = true
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
            this.dirty = true
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
            this.dirty = true
        }
    }


    @action
    public setColorScheme(newColorScheme: SupportedColorScheme) {
        if (this.colorScheme != newColorScheme) {
            this.colorScheme = newColorScheme
            this.dirty = false
        }
    }
    @action
    public setEditorPanels(value: string) {
        this.editorPanels = value
    }

    @action
    public resetToDefaults() {
        this.fontSize = 12
        this.colorScheme = 'dark'
        this.editorPanels = ''
        this.pkceListenerPort = 8080
    }
}
