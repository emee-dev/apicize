import { Toast } from "../controls/toast"
import { ConfirmationDialog } from "../controls/confirmation-dialog"
import { FeedbackContext, FeedbackStore } from "@apicize/toolkit"
import React from "react"
import { ReactNode } from "react"

export function FeedbackProvider({ children }: { children?: ReactNode }) {
    const store = new FeedbackStore()
    
    return (
        <FeedbackContext.Provider value={store}>
            {children}
            <Toast />
            <ConfirmationDialog />
        </FeedbackContext.Provider>
    )
}