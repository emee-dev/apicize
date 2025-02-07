import { GroupExecution } from "./request"

/**
 * Interface that expresses we can run something
 */
export interface Executable {
    runs: number
    multiRunExecution: GroupExecution
}
