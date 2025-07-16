import * as app from '@tauri-apps/api/app'
import * as core from '@tauri-apps/api/core'
import * as os from '@tauri-apps/plugin-os'
import { ReactNode } from "react";
import { ApicizeContext, ApicizeSettings } from "@apicize/toolkit";

export function ApicizeProvider({
    settings, children
}: {
    settings: ApicizeSettings
    children?: ReactNode
}) {

    (async () => {
        const [name, version, isReleaseMode, storage] = await Promise.all([
            app.getName(),
            app.getVersion(),
            core.invoke<boolean>('is_release_mode'),
            core.invoke<StorageInformation>('get_storage_information'),
        ])

        if (isReleaseMode) {
            document.addEventListener('contextmenu', event => event.preventDefault())
        }

        settings.changeApp(name, version, storage.settingsFileName, storage.globalsFileName)
        try {
            settings.setOs(os.type())
        } catch (e) {
            console.error("Uanble to detect OS", e)
        }
    })()
    return (
        <ApicizeContext.Provider value={settings}>
            {children}
        </ApicizeContext.Provider>
    )
}

interface StorageInformation {
    globalsFileName: string
    settingsFileName: string
}
