import { action, makeObservable, observable } from 'mobx';
import { createContext, useContext } from 'react'

export class ClipboardStore {
    @observable accessor hasText: boolean = false
    @observable accessor hasImage: boolean = false

    constructor(private readonly callbacks: {
        onWriteText: (text: string) => Promise<void>,
        onWriteImage: (data: Uint8Array) => Promise<void>,
        onGetText: () => Promise<string>,
        onGetImage: () => Promise<Uint8Array>,
    }) {
        makeObservable(this)
    }

    writeTextToClipboard(text: string): Promise<void> {
        return this.callbacks.onWriteText(text)
    }
    
    writeImageToClipboard(data: Uint8Array): Promise<void> {
        return this.callbacks.onWriteImage(data)
    }

    getClipboardText() {
        return this.callbacks.onGetText()
    }

    getClipboardImage() {
        return this.callbacks.onGetImage()
    }

    @action
    updateClipboardTextStatus(onOff: boolean) {
        this.hasText = onOff
    }

    @action
    updateClipboardImageStatus(onOff: boolean) {
        this.hasImage = onOff
    }
}

export const ClipboardContext = createContext<ClipboardStore | null>(null)

export function useClipboard() {
    const context = useContext(ClipboardContext);
    if (! context) {
        throw new Error('useClipboard must be used within a ClipboardContext.Provider');
    }
    return context;
}
