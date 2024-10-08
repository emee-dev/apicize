import { StoredGlobalSettings } from "@apicize/lib-typescript";
import { SupportedColorScheme } from "@mui/material";
import { makeAutoObservable } from "mobx";
import { createContext, ReactNode, useContext } from "react";
import * as core from '@tauri-apps/api/core'
import * as path from '@tauri-apps/api/path'
import { ApicizeSettingsContext, ApicizeSettingsStore } from "@apicize/toolkit";



export function ApicizeSettingsProvider({
    store, children
}: {
    store: ApicizeSettingsStore
    children?: ReactNode
}) {
    return (
        <ApicizeSettingsContext.Provider value={store}>
            {children}
        </ApicizeSettingsContext.Provider>
    )
}
