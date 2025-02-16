export interface ApicizeRequest {
    url: string,
    method: string
    headers: Map<string, string>
    body?: ApicizeBody
    variables?: Map<string, string | number | boolean>
}

export interface ApicizeBody {
    data?: string
    text?: string
}

export interface ApicizeExecution {
    duration: number
    items: ApicizeExecutionItem[]

}

export type ApicizeExecutionItem = ApicizeExecutionGroup | ApicizeExecutionRequest

export interface ApicizeError {
    type: string
    description: string
    url?: string
    source?: ApicizeError
}

export interface ApicizeExecutionRequest {
    type: 'request'
    id: string
    name: string
    executedAt: number
    duration: number
    runs: ApicizeExecutionRequestRun[]
    variables?: Map<string, string | number | boolean>
    success: boolean
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
    error?: ApicizeError
}

export interface ApicizeExecutionRequestRun {
    runNumber: number
    executedAt: number
    duration: number
    request?: ApicizeRequest
    response?: ApicizeResponse
    success: boolean
    error?: ApicizeError
    tests?: ApicizeTestResult[]
    variables?: Map<string, string | number | boolean>
    inputVariables?: Map<string, string | number | boolean>
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
}

export interface TokenResult {
    token: string
    cached: boolean
    url?: string
    certificate?: string
    proxy?: string
}

export interface ApicizeResponse {
    status: number
    statusText: string
    headers?: Map<string, string>
    body?: ApicizeBody,
    oauth2Token?: TokenResult
}

export interface ApicizeTestResult {
    testName: string[]
    success: boolean,
    error?: string
    logs?: string[]
}

export interface ApicizeExecutionGroup {
    type: 'group'
    id: string
    name: string
    executedAt: number
    duration: number
    runs: ApicizeExecutionGroupRun[]
    success: boolean
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
    error?: ApicizeError
}

export interface ApicizeExecutionGroupRun {
    runNumber: number
    executedAt: number
    duration: number
    items: ApicizeExecutionItem[]
    variables?: Map<string, string | number | boolean>
    success: boolean
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
}

/**
 * Formatted execution details, separating what can be accessed within the testing context
 */
export interface ApicizeExecutionDetails {
    runNumber: number
    executedAt: number
    duration: number
    testingContext?: {
        request?: ApicizeRequest
        response?: ApicizeResponse
        variables?: Map<string, string | number | boolean>
    }
    success: boolean
    error?: ApicizeError
    tests?: ApicizeTestResult[]
    outputVariables?: Map<string, string | number | boolean>
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
}

export type RunError = string | 'Cancelled' | { id: string, repr: object }