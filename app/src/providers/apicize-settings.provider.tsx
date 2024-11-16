import { ReactNode } from "react";
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
