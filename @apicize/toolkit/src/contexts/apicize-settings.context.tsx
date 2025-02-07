import { createContext, useContext } from 'react'
import { ApicizeSettings } from '../models/settings';

export const ApicizeSettingsContext = createContext<ApicizeSettings | null>(null)

export function useApicizeSettings() {
    const context = useContext(ApicizeSettingsContext);
    if (!context) {
        throw new Error('useApicizeSettings must be used within a ApicizeSettingsContext.Provider');
    }
    return context;
}
