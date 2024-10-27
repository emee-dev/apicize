import { Selection } from "./selection"
import { WorkbookGroupExecution } from "./workbook/workbook-request"

/**
 * Interface that expresses we can run something
 */
export interface Executable {
    runs: number
    multiRunExecution: WorkbookGroupExecution
    selectedScenario?: Selection
    selectedAuthorization?: Selection
    selectedCertificate?: Selection
    selectedProxy?: Selection
}
