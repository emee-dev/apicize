import { createContext, useContext } from "react";
import { WorkspaceStore } from "./workspace.context";

export const PkceContext = createContext<WorkspaceStore | null>(null)

export function usePkce() {
    const context = useContext(PkceContext);
    if (!context) {
        throw new Error('usePkce must be used within a PkceContext.Provider');
    }
    return context;
}
