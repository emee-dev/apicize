import { action, observable } from "mobx"
import { ReqwestEvent } from "../models/trace"
import { createContext, useContext } from "react"

export class LogStore {
    @observable accessor events: ReqwestEvent[] = []

    @action
    addEvent(event: ReqwestEvent) {
        if (this.events.length > 100) {
            this.events = [...this.events.slice(0, 99), event]
        } else {
            this.events.push(event)
        }
    }

    @action
    clear() {
        this.events = []
    }
}

export const LogContext = createContext<LogStore | null>(null)

export function useLog() {
    const context = useContext(LogContext);
    if (!context) {
        throw new Error('useLog must be used within a LogContext.Provider');
    }
    return context;
}