import { ApicizeError, ApicizeTestBehavior } from "./execution"
import { ExecutionResultSuccess } from "./execution-result-success"

/**
 * Summary information about a request or group execution used for menus and summaries
 */
export interface ExecutionResultSummary {
    requestOrGroupId: string
    index: number
    parentIndex?: number
    childIndexes?: number[]
    level: number
    name: string
    executedAt: number
    duration: number
    method?: string
    url?: string
    status?: number
    statusText: string
    hasResponseHeaders: boolean
    responseBodyLength?: number
    success: ExecutionResultSuccess
    error?: ApicizeError
    testResults?: ApicizeTestBehavior[]
    runNumber?: number
    runCount?: number
    rowNumber?: number
    rowCount?: number
}
