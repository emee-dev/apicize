import { createContext, useContext } from 'react'
import { EditableSettings } from '../models/editable-settings';

export const ApicizeSettingsContext = createContext<EditableSettings | null>(null)

export function useApicizeSettings() {
    const context = useContext(ApicizeSettingsContext);
    if (!context) {
        throw new Error('useApicizeSettings must be used within a ApicizeSettingsContext.Provider');
    }
    return context;
}
