import { ApicizeRequest } from "./apicize-request";
import { ApicizeResponse } from "./apicize-response";
import { ApicizeTestResult } from "./apicize-test-result";

export interface ApicizeResult {
    requestId: string;
    run: number;
    totalRuns: number;
    request?: ApicizeRequest
    response?: ApicizeResponse
    tests?: ApicizeTestResult[]
    executedAt: number
    milliseconds: number
    success: boolean
    testCount?: number
    failedTestCount?: number
    errorMessage?: string
}

export type ApicizeResults = { [id: string]: ApicizeResult }

export interface ApicizeExecutionResults {
    runs: ApicizeResult[][]
    milliseconds: number
}
