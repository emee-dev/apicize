import { StoredGlobalSettings } from "@apicize/lib-typescript";
import { SupportedColorScheme } from "@mui/material";
import { makeAutoObservable } from "mobx";
import { createContext, ReactNode, useContext } from "react";
import * as core from '@tauri-apps/api/core'
import * as path from '@tauri-apps/api/path'

export class ApicizeSettings {
    private _dirty = false
    private _workbookDirectory: string = ''
    private _lastWorkbookFileName: string | undefined
    private _fontSize = 12
    private _colorScheme: SupportedColorScheme = 'dark'
    private _showSettings = false

    constructor() {
        makeAutoObservable(this)
    }

    public get dirty() {
        return this._dirty
    }

    public set dirty(onOff: boolean) {
        this._dirty = onOff
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
}

export const ApicizeSettingsContext = createContext<ApicizeSettings | null>(null)

export function useApicizeSettings() {
    const context = useContext(ApicizeSettingsContext);
    if (!context) {
        throw new Error('useApicizeSettings must be used within a ApicizeSettingsContext.Provider');
    }
    return context;
}

export function ApicizeSettingsProvider({
    store, children
}: {
    store: ApicizeSettings
    children?: ReactNode
}) {
    return (
        <ApicizeSettingsContext.Provider value={store}>
            {children}
        </ApicizeSettingsContext.Provider>
    )
}
