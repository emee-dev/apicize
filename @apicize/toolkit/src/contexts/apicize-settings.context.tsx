import { SupportedColorScheme } from '@mui/material';
import { makeAutoObservable } from 'mobx';
import { createContext, useContext } from 'react'

export class ApicizeSettingsStore {
    private _dirty = false
    private _workbookDirectory: string = ''
    private _lastWorkbookFileName: string | undefined
    private _fontSize = 12
    private _colorScheme: SupportedColorScheme = 'dark'
    private _showSettings = false
    private _editorPanels = ''
    private _recentWorkbookFileNames: string[] = []

    constructor() {
        makeAutoObservable(this)
    }

    public get dirty() {
        return this._dirty
    }

    public set dirty(value: boolean) {
        this._dirty = value
    }

    public get workbookDirectory(): string {
        return this._workbookDirectory
    }

    public set workbookDirectory(newDirectory) {
        if (this._workbookDirectory !== newDirectory) {
            this._workbookDirectory = newDirectory
            this._dirty = true
        }
    }

    public get lastWorkbookFileName(): string | undefined {
        return this._lastWorkbookFileName
    }

    public set lastWorkbookFileName(newLastWorkbookFileName: string | undefined) {
        if (this._lastWorkbookFileName != newLastWorkbookFileName) {
            this._lastWorkbookFileName = newLastWorkbookFileName
            this._dirty = true
        }
    }

    public get recentWorkbookFileNames(): string[] {
        return this._recentWorkbookFileNames
    }

    public set recentWorkbookFileNames(newRecentWorkbookFileNames: string[]) {
        if (this._recentWorkbookFileNames.join(';') != newRecentWorkbookFileNames.join(';')) {
            this._recentWorkbookFileNames = newRecentWorkbookFileNames
            this._dirty = true
        }
    }

    public addRecentWorkbookFileName(fileName: string) {
        const i = this._recentWorkbookFileNames.indexOf(fileName)
        if (i !== 0) {
            if (i !== -1) {
                this._recentWorkbookFileNames.splice(i, 1)
            }
            this._recentWorkbookFileNames = [fileName, ...this._recentWorkbookFileNames.slice(0, 10)]
            this._dirty = true
        }
    }

    public removeRecentWorkbookFileName(fileName: string) {
        const i = this._recentWorkbookFileNames.indexOf(fileName)
        if (i !== 0) {
            if (i !== -1) {
                this._recentWorkbookFileNames.splice(i, 1)
            }
        }
    }

    public get fontSize(): number {
        return this._fontSize
    }

    public set fontSize(newFontSize: number) {
        if (this._fontSize != newFontSize) {
            this._fontSize = newFontSize
            this._dirty = true
        }
    }

    public get colorScheme(): SupportedColorScheme {
        return this._colorScheme
    }

    public set colorScheme(newColorScheme: SupportedColorScheme) {
        if (this._colorScheme != newColorScheme) {
            this._colorScheme = newColorScheme
            this._dirty = false
        }
    }

    public get showSettings() {
        return this._showSettings
    }

    public set showSettings(onOff: boolean) {
        this._showSettings = onOff
    }

    public get editorPanels() {
        return this._editorPanels
    }

    public set editorPanels(value: string) {
        this._editorPanels = value
    }

    public resetToDefaults() {
        this.fontSize = 12
        this.colorScheme = 'dark'
        this.editorPanels = ''
    }
}

export const ApicizeSettingsContext = createContext<ApicizeSettingsStore | null>(null)

export function useApicizeSettings() {
    const context = useContext(ApicizeSettingsContext);
    if (!context) {
        throw new Error('useApicizeSettings must be used within a ApicizeSettingsContext.Provider');
    }
    return context;
}
