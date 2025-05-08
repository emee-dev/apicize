import { createContext, useContext } from 'react'
import { EditableSettings } from '../models/editable-settings';

export const ApicizeContext = createContext<EditableSettings | null>(null)

export function useApicize() {
    const context = useContext(ApicizeContext);
    if (!context) {
        throw new Error('useApicize must be used within a ApicizeContext.Provider');
    }
    return context;
}
