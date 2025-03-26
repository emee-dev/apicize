import { createContext, useContext } from 'react'
import { ApicizeSettings } from '../models/settings';

export const ApicizeContext = createContext<ApicizeSettings | null>(null)

export function useApicize() {
    const context = useContext(ApicizeContext);
    if (!context) {
        throw new Error('useApicize must be used within a ApicizeContext.Provider');
    }
    return context;
}
