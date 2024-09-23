import { Selection } from "./selection"

/**
 * Interface that expresses we can run something
 */
export interface Executable {
    runs: number
    selectedScenario?: Selection
    selectedAuthorization?: Selection
    selectedCertificate?: Selection
    selectedProxy?: Selection
}
