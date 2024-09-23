import { ReactNode, useEffect, useMemo, useRef } from "react";
import { IMAGE_CHANGED, TEXT_CHANGED, hasImage, hasText, readText, readImageBase64, writeImageBase64, writeText, startListening, onClipboardUpdate } from "tauri-plugin-clipboard-api"
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { ClipboardContext, ClipboardStore, ToastSeverity, useFeedback } from "@apicize/toolkit";

/**
 * Implementation of clipboard operations via Tauri
 */
export function ClipboardProvider({
    children
}: {
    children?: ReactNode
}) {
    const feedback = useFeedback()

    const store = useMemo(
        () => new ClipboardStore({
            onWriteText: async (text: string) => {
                try {
                    await writeText(text)
                    feedback.toast('Text copied to clipboard', ToastSeverity.Success)
                } catch (e) {
                    feedback.toast(`${e}`, ToastSeverity.Error)
                }
            },
            onWriteImage: async (base64: string) => {
                try {
                    const m = base64.length % 4
                    if (m) {
                        base64 += '==='.substring(0, 4 - m)
                    }
                    await writeImageBase64(base64)
                    feedback.toast('Image copied to clipboard', ToastSeverity.Success)
                } catch (e) {
                    feedback.toast(`${e}`, ToastSeverity.Error)
                }
            },
            onGetText: () => {
                return readText()
            },
            onGetImage: () => {
                return readImageBase64()
            },
        }),
        [feedback]
    )

    useEffect(() => {
        const updateClipboardState = async (state: {
            text: boolean,
            image: boolean
        }) => {
            store.updateClipboardTextStatus(state.text)
            store.updateClipboardImageStatus(state.image)
            if (state.image) {
                const tryReadImage = (attempt: number) => {
                    readImageBase64()
                        .then(() => { store.updateClipboardImageStatus(true) })
                        .catch(() => {
                            if (attempt < 30) setTimeout(() => tryReadImage(attempt + 1), 100)
                        })
                }
                tryReadImage(0)
            }
        }

        const unlisten = onClipboardUpdate(updateClipboardState)
        Promise.all([hasText(), hasImage()]).then(([text, image]) => {
            updateClipboardState({
                text, image
            })
        })
        return () => {
            unlisten.then(() => { })
        }
    }, [store])

    return (
        <ClipboardContext.Provider value={store}>
            {children}
        </ClipboardContext.Provider>
    )
}
