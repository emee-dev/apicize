export interface ApicizeExecution {
    duration: number
    runs: ApicizeExecutionRun[]
}

export interface ApicizeExecutionRun {
    executedAt: number
    duration: number
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
    items: ApicizeExecutionItem[]
}

export type ApicizeExecutionItem = ApicizeExecutionGroup | ApicizeExecutionRequest

export interface ApicizeExecutionRequest {
    type: 'request'
    id: string
    name: string
    executedAt: number
    duration: number
    request?: ApicizeRequest
    response?: ApicizeResponse
    tests?: ApicizeExecutedTestResponse
    success: boolean
    passedTestCount?: number
    failedTestCount?: number
    errorMessage?: string
}


export interface ApicizeExecutionGroup {
    type: 'group'
    id: string
    name: string
    executedAt: number
    duration: number
    requestsWithPassedTestsCount: number
    requestsWithFailedTestsCount: number
    requestsWithErrors: number
    passedTestCount: number
    failedTestCount: number
    items: ApicizeExecutionItem[]
}

export interface ApicizeRequest {
    url: string,
    method: string
    headers: Map<string, string>
    body?: ApicizeBody
    variables?: Map<string, string | number | boolean>
}

export interface ApicizeResponse {
    status: number
    statusText: string
    headers?: Map<string, string>
    body?: ApicizeBody,
    authTokenCached?: boolean
}

export interface ApicizeBody {
    data?: string
    text?: string
}

export interface ApicizeExecutedTestResponse {
    results?: ApicizeTestResult[]
    variables: Map<string, string | number | boolean>
}

export interface ApicizeTestResult {
    testName: string[]
    success: boolean,
    error?: string
    logs?: string[]
}

export type RunError = string | 'Cancelled' | { id: string, repr: object }