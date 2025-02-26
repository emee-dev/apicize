export type JsonValue = string | number | boolean | [] | Object

export type ApicizeGroupItem = ApicizeGroup | ApicizeRequest

export type ApicizeGroupChildren = ApicizeGroupItemList | ApicizeGroupRunList

export type ApicizeGroupItemChildren = ApicizeGroupItemList | ApicizeGroupRunList

export type ApicizeExecutionType = ApicizeExecutionSingle | ApicizeExecutionRuns

export type ApicizeResult = ApicizeGroup | ApicizeRequest | ApicizeRowList

export interface ApicizeRow {
    rowNumber: number
    item: ApicizeGroupItem

    executedAt: number
    duration: number

    success: boolean    
    requestSuccessCount: number
    requestFailureCount: number
    requestErrorCount: number
    passedTestCount: number
    failedTestCount: number
}

export interface ApicizeRowList {
    type: 'Rows',
    items: ApicizeRow[]
}

export interface ApicizeGroupItemList {
    type: 'Items',
    items: ApicizeGroupItem[]
}

export interface ApicizeGroupRunList {
    type: 'Runs',
    items: ApicizeGroupRun[]
}

export interface ApicizeExecutionSingle extends ApicizeExecution {
    type: 'Single'
}

export interface ApicizeExecutionRuns {
    type: 'Runs'
    items: ApicizeExecution[]
}

export interface ApicizeGroup {
    type: 'Group'

    id: string
    name: string

    executedAt: number
    duration: number
    // variables?: Map<string, JsonValue>
    outputVariables?: Map<string, JsonValue>
    children?: ApicizeGroupChildren
    
    success: boolean    
    requestSuccessCount: number
    requestFailureCount: number
    requestErrorCount: number
    passedTestCount: number
    failedTestCount: number
}

export interface ApicizeGroupRun {
    type: 'GroupRun',
    runNumber: number

    executedAt: number
    duration: number

    children?: ApicizeGroupItem[]

    outputVariables?: Map<string, JsonValue>
    
    success: boolean    
    requestSuccessCount: number
    requestFailureCount: number
    requestErrorCount: number
    passedTestCount: number
    failedTestCount: number  
}

// export interface ApicizeRowRuns {
//     type: 'RowRuns'
//     rowNumber: number

//     executedAt: number
//     duration: number

//     runs?: ApicizeExecution[]
//     outputVariables?: Map<string, JsonValue>
    
//     success: boolean    
//     requestSuccessCount: number
//     requestFailureCount: number
//     requestErrorCount: number
//     passedTestCount: number
//     failedTestCount: number  
// }

export interface ApicizeRequest {
    type: 'Request'

    id: string
    name: string

    executedAt: number
    duration: number
    outputVariables?: Map<string, JsonValue>
    
    execution?: ApicizeExecutionType

    success: boolean    
    requestSuccessCount: number
    requestFailureCount: number
    requestErrorCount: number
    passedTestCount: number
    failedTestCount: number
}

export interface ApicizeExecution {
    index?: number

    executedAt: number
    duration: number

    inputVariables?: Map<string, JsonValue>
    data?: Map<string, JsonValue>
    outputVariables?: Map<string, JsonValue>

    url: string,
    method: string
    headers: Map<string, string>
    body?: ApicizeBody
    variables?: Map<string, string | number | boolean>
    
    response?: ApicizeResponse
    tests?: ApicizeTestResult[]
    error?: ApicizeError

    success: boolean    
    passedTestCount: number
    failedTestCount: number
}

export interface ApicizeBody {
    data?: string
    text?: string
}

export interface ApicizeResponse {
    status: number
    statusText: string
    headers?: Map<string, string>
    body?: ApicizeBody,
    oauth2Token?: TokenResult
}

export interface TokenResult {
    token: string
    cached: boolean
    url?: string
    certificate?: string
    proxy?: string
}

export interface ApicizeTestResult {
    testName: string[]
    success: boolean,
    error?: string
    logs?: string[]
}

export interface ApicizeError {
    type: string
    description: string
    url?: string
    source?: ApicizeError
}


// export interface ApicizeRequestWithExecution {
//     id: string
//     name: string
//     executedAt: number
//     duration: number
//     inputVariables?: Map<string, JsonValue>
//     data?: Map<string, JsonValue>
//     outputVariables?: Map<string, JsonValue>
    
//     url: string,
//     method: string
//     headers: Map<string, string>
//     body?: ApicizeBody
//     variables?: Map<string, string | number | boolean>

//     response?: ApicizeResponse
//     tests?: ApicizeTestResult[]
//     error?: ApicizeError

//     success: boolean
//     passedTestCount: number
//     failedTestCount: number
// }







// export interface ApicizeRequest {
//     url: string,
//     method: string
//     headers: Map<string, string>
//     body?: ApicizeBody
//     variables?: Map<string, string | number | boolean>
// }


// export interface ApicizeExecution {
//     duration: number
//     items: ApicizeExecutionItem[]

// }

// export type ApicizeExecutionItem = ApicizeExecutionGroup | ApicizeExecutionRequest

// export interface ApicizeError {
//     type: string
//     description: string
//     url?: string
//     source?: ApicizeError
// }

// export interface ApicizeExecutionRequest {
//     type: 'request'
//     id: string
//     name: string
//     executedAt: number
//     duration: number
//     runs: ApicizeExecutionRequestRun[]
//     variables?: Map<string, string | number | boolean>
//     success: boolean
//     requestsWithPassedTestsCount: number
//     requestsWithFailedTestsCount: number
//     requestsWithErrors: number
//     passedTestCount: number
//     failedTestCount: number
//     error?: ApicizeError
// }

// export interface ApicizeExecutionRequestRun {
//     runNumber: number
//     numberOfRuns: number
//     rowNumber: number | undefined
//     totalRows: number | undefined
//     executedAt: number
//     duration: number
//     request?: ApicizeRequest
//     response?: ApicizeResponse
//     success: boolean
//     error?: ApicizeError
//     tests?: ApicizeTestResult[]
//     variables?: Map<string, string | number | boolean>
//     inputVariables?: Map<string, string | number | boolean>
//     requestsWithPassedTestsCount: number
//     requestsWithFailedTestsCount: number
//     requestsWithErrors: number
//     passedTestCount: number
//     failedTestCount: number
// }

// export interface TokenResult {
//     token: string
//     cached: boolean
//     url?: string
//     certificate?: string
//     proxy?: string
// }

// export interface ApicizeResponse {
//     status: number
//     statusText: string
//     headers?: Map<string, string>
//     body?: ApicizeBody,
//     oauth2Token?: TokenResult
// }

// export interface ApicizeTestResult {
//     testName: string[]
//     success: boolean,
//     error?: string
//     logs?: string[]
// }

// export interface ApicizeExecutionGroup {
//     type: 'group'
//     id: string
//     name: string
//     executedAt: number
//     duration: number
//     runs: ApicizeExecutionGroupRun[]
//     success: boolean
//     requestsWithPassedTestsCount: number
//     requestsWithFailedTestsCount: number
//     requestsWithErrors: number
//     passedTestCount: number
//     failedTestCount: number
//     error?: ApicizeError
// }

// export interface ApicizeExecutionGroupRun {
//     runNumber: number
//     numberOfRuns: number
//     rowNumber: number | undefined
//     totalRows: number | undefined
//     executedAt: number
//     duration: number
//     items: ApicizeExecutionItem[]
//     variables?: Map<string, string | number | boolean>
//     success: boolean
//     requestsWithPassedTestsCount: number
//     requestsWithFailedTestsCount: number
//     requestsWithErrors: number
//     passedTestCount: number
//     failedTestCount: number
// }

// /**
//  * Formatted execution details, separating what can be accessed within the testing context
//  */
// export interface ApicizeExecutionDetails {
//     runNumber: number
//     rowNumber?: number
//     totalRows?: number
//     executedAt: number
//     duration: number
//     testingContext?: {
//         request?: ApicizeRequest
//         response?: ApicizeResponse
//         variables?: Map<string, string | number | boolean>
//     }
//     success: boolean
//     error?: ApicizeError
//     tests?: ApicizeTestResult[]
//     outputVariables?: Map<string, string | number | boolean>
//     requestsWithPassedTestsCount: number
//     requestsWithFailedTestsCount: number
//     requestsWithErrors: number
//     passedTestCount: number
//     failedTestCount: number
// }

// export type RunError = string | 'Cancelled' | { id: string, repr: object }