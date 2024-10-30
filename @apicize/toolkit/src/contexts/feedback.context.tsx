import { action, makeObservable, observable } from "mobx";
import { createContext, useContext } from "react";

/**
 * Manages state for Toast and Confirmation dialogs
 */
export class FeedbackStore {
    @observable accessor toastOpen = false
    @observable accessor toastMessage = ''
    @observable accessor toastSeverity = ToastSeverity.Info

    @observable accessor confirmOpen = false
    @observable accessor confirmOptions: ConfirmationOptions = {}

    constructor() {
        makeObservable(this)
    }

    private confirmResolve: (ok: boolean) => void = () => { };


    @action
    toast(message: string, severity: ToastSeverity) {
        this.toastMessage = message
        this.toastSeverity = severity
        this.toastOpen = true
    }

    @action
    closeToast() {
        this.toastOpen = false
    }

    @action
    confirm(options: ConfirmationOptions): Promise<boolean> {
        return new Promise((resolve) => {
            this.confirmResolve = resolve
            this.confirmOptions = options
            this.confirmOpen = true
        })
    }

    @action closeConfirm(ok: boolean) {
        this.confirmOpen = false
        this.confirmResolve(ok)
    }

}

export const FeedbackContext = createContext<FeedbackStore | null>(null)

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (! context) {
        throw new Error('useFeedback must be used within a FeedbackContext.Provider');
    }
    return context;
}

export enum ToastSeverity {
    Error = 'error',
    Warning = 'warning',
    Info = 'info',
    Success = 'success'
}

export interface ConfirmationOptions {
    // catchOnCancel?: boolean,
    title?: string,
    message?: string,
    okButton?: string,
    defaultToCancel?: boolean,
    cancelButton?: string
}