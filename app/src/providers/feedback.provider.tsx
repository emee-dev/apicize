import { Toast } from "../controls/toast"
import { ConfirmationDialog } from "../controls/confirmation-dialog"
import { FeedbackContext, FeedbackStore, ToastSeverity } from "@apicize/toolkit"
import React, { useEffect } from "react"
import { ReactNode } from "react"
import { ModalBlock } from "../controls/modal-block."
import { listen } from "@tauri-apps/api/event"

export function FeedbackProvider({ children }: { children?: ReactNode }) {
    const store = new FeedbackStore()
    return (
        <FeedbackContext.Provider value={store}>
            <ModalBlock key='feedback-modal' />
            {children}
            <Toast key='feedback-toast' />
            <ConfirmationDialog key='feedback-confirm' />
        </FeedbackContext.Provider>
    )
}