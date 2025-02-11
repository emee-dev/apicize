import { ReactNode } from "react";
import { ApicizeSettings, ApicizeSettingsContext } from "@apicize/toolkit";

export function ApicizeSettingsProvider({
    settings, children
}: {
    settings: ApicizeSettings
    children?: ReactNode
}) {
    debugger
    return (
        <ApicizeSettingsContext.Provider value={settings}>
            {children}
        </ApicizeSettingsContext.Provider>
    )
}
