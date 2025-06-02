import { ExecutionResultSuccess } from "@apicize/lib-typescript"
import { ApicizeError, ApicizeTestResult } from "@apicize/lib-typescript/src/models/execution"

export type ExecutionReport = ExecutionReportJson

export interface ExecutionReportJson {
    type: 'JSON',
    data: ExecutionReportJsonRecord[]
}

export interface ExecutionReportJsonRecord {
    name: string
    executedAt: number
    duration: number
    success: ExecutionResultSuccess
    status?: number
    statusText: string
    responseBodyLength?: number
    error?: ApicizeError
    testResults?: ApicizeTestResult[]
    runNumber?: number
    runCount?: number
    rowNumber?: number
    rowCount?: number
    children?: ExecutionReportJsonRecord[]
}
