import { ExecutionResultSummary } from "./execution-result-summary"

export interface ExecutionStatus {
    requestOrGroupId: string
    running: boolean
    results?: ExecutionResultSummary[]
}