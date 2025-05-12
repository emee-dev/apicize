import { ApicizeError, ApicizeHttpRequest, ApicizeHttpResponse, ApicizeTestResult, JsonValue } from "../execution"
import { ExecutionResultSuccess } from "./execution-result-success"

export type ExecutionResultDetail = ExecutionResultDetailRequest | ExecutionResultDetailGroup

export interface ExecutionResultDetailRequest {
    entityType: 'request'

    /// Request ID
    id: string,

    /// Request name
    name: string,

    /// Row number (if applicable)
    rowNumber?: number,

    // Run number (if applicable)
    runNumber?: number,

    /// Execution start (millisecond offset from start)
    executedAt: number,

    /// Duration of execution (milliseconds)
    duration: number,

    /// Variables assigned to the request
    variables?: Map<string, JsonValue>,

    /// Row data assigned to the request
    data?: Map<string, JsonValue>,

    /// Variables to update at the end of the request
    outputVariables?: Map<string, JsonValue>,

    /// Request sent to server
    request?: ApicizeHttpRequest,

    /// Response received from server (if any)
    response?: ApicizeHttpResponse,

    /// Test results (if executed)
    tests?: ApicizeTestResult[],

    /// Error on dispatch or error execution
    error?: ApicizeError,

    /// Success is true if all runs are successful
    success: ExecutionResultSuccess

    /// Number of child requests/groups with successful requests and all tests passed
    requestSuccessCount: number,

    /// Number of child requests/groups with successful requests and some tests failed
    requestFailureCount: number,

    /// Number of child requests/groups with successful requests and some tests failed
    requestErrorCunt: number,

    /// Number of passed tests, if request and tests are succesfully run
    testPassCount: number,

    /// Number of failed tests, if request and tests are succesfully run
    testFailCount: number,
}

/// Represents detailed execution information of a request
export interface ExecutionResultDetailGroup {
    entityType: 'grouped'

    /// Request ID
    id: string,

    /// Request name
    name: string,

    /// Row number (if applicable)
    rowNumber?: number,

    // Run number (if applicable)
    runNumber?: number,

    /// Execution start (millisecond offset from start)
    executedAt: number,

    /// Duration of execution (milliseconds)
    duration: number,

    /// Variables to update at the end of the grou's requests
    outputVariables?: Map<string, JsonValue>,

    /// Indicates level of call success
    success: ExecutionResultSuccess

    /// Number of child requests/groups with successful requests and all tests passed
    requestSuccessCount: number,

    /// Number of child requests/groups with successful requests and some tests failed
    requestFailureCount: number,

    /// Number of child requests/groups with successful requests and some tests failed
    requestErrorCount: number,

    /// Number of passed tests, if request and tests are succesfully run
    testPassCount: number,

    /// Number of failed tests, if request and tests are succesfully run
    testFailCount: number,
}
