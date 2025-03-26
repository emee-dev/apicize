import { ReactNode, useEffect, useMemo } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { FileDragDropContext, FileDragDropStore, ToastSeverity, useFeedback } from "@apicize/toolkit";
import { Body } from '@apicize/lib-typescript'
import * as core from '@tauri-apps/api/core'
import { DroppedFile } from "@apicize/toolkit/dist/contexts/file-dragdrop.context";

/**
 * Implementation of file drag/drop operations via Tauri
 */
export function FileDragDropProvider({
    children
}: {
    children?: ReactNode
}) {
    const feedback = useFeedback()

    const store = useMemo(
        () => new FileDragDropStore(),
        []
    )

    useEffect(() => {
        let unlisten = getCurrentWebview().onDragDropEvent((e) => {
            switch (e.payload.type) {
                case 'enter':
                    store.onEnter(e.payload.position.x, e.payload.position.y, e.payload.paths)
                    break
                case 'over':
                    store.onOver(e.payload.position.x, e.payload.position.y)
                    break
                case 'leave':
                    store.onLeave()
                    break
                case 'drop':
                    core.invoke<DroppedFile>('get_clipboard_file_data', { paths: e.payload.paths }).then(
                        (f: DroppedFile) => store.onDrop(f)
                    ).catch((e) => {
                        feedback.toast(`${e}`, ToastSeverity.Error)
                    })
                    break
            }
        })

        return () => {
            unlisten.then(() => { })
        }
    }, [store, feedback])

    return (
        <FileDragDropContext.Provider value={store}>
            {children}
        </FileDragDropContext.Provider>
    )
}
