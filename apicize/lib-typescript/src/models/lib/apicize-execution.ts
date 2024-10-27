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
}

export interface ApicizeExecutionRequestRun {
    runNumber: number
    executedAt: number
    duration: number
    request ?: ApicizeRequest
    response ?: ApicizeHttpResponse
    success: boolean
    error?: string
    tests?: ApicizeTestResult[]
    variables?: Map<string, string | number | boolean>
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
}

export interface ApicizeHttpResponse {
    status: number
    statusText: string
    headers?: Map<string, string>
    body?: ApicizeBody,
 
    authTokenCached?: boolean
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

export type RunError = string | 'Cancelled' | { id: string, repr: object }