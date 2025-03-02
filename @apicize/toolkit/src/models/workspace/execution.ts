import { ApicizeBody, ApicizeError, ApicizeExecution, ApicizeExecutionSummary, ApicizeExecutionType, ApicizeGroup, ApicizeGroupRun, ApicizeRequest, ApicizeHttpResponse, ApicizeTestResult, JsonValue, ApicizeHttpRequest } from "@apicize/lib-typescript";
import { OverridableStringUnion } from '@mui/types'
import { SvgIconPropsColorOverrides } from "@mui/material"
import { exec } from "child_process";

export interface ExecutionMenuItem {
     index: number
     title: string
     level: number
}

export type ExecutionData = ApicizeGroup | ApicizeGroupRun | ApicizeRequest | ApicizeExecutionType

export interface ExecutionResultInfo {
     index: number,
     title: string
     parentIndex?: number
     childIndexes?: number[]
     runNumber?: number
     runCount?: number
     rowNumber?: number
     rowCount?: number
}

export interface ExecutionResult {
     info: ExecutionResultInfo

     executedAt: number
     duration: number

     request?: ApicizeHttpRequest
     response?: ApicizeHttpResponse

     inputVariables?: Map<String, JsonValue>,
     data?: Map<String, JsonValue>[],
     outputVariables?: Map<String, JsonValue>,

     tests?: ApicizeTestResult[]
     error?: ApicizeError,

     success: boolean
     requestSuccessCount?: number
     requestFailureCount?: number
     requestErrorCount?: number
     testPassCount: number
     testFailCount: number
}

export interface ExecutionResultSummary {
     title: string
     runNumber?: number
     rowNumber?: number

     executedAt: number
     duration: number

     request?: ApicizeHttpRequest
     response?: ApicizeHttpResponse

     inputVariables?: Map<String, JsonValue>,
     data?: Map<String, JsonValue>[],
     outputVariables?: Map<String, JsonValue>,

     tests?: ExecutionResultSummaryTest[]
     error?: ApicizeError,

     success: boolean
     requestSuccessCount?: number
     requestFailureCount?: number
     requestErrorCount?: number
     testPassCount: number
     testFailCount: number

     children?: ExecutionResultSummary[]
}

export interface ExecutionResultSummaryTest {
     testName: string
     success: boolean,
     error?: string
     logs?: string[]
 }
 


export interface Execution {
     requestOrGroupId: string
     running: boolean
     panel: string
     resultIndex: number
     resultMenu: ExecutionMenuItem[]
     results: ExecutionResult[]
}

export function executionResultFromSummary(info: ExecutionResultInfo, summary: ApicizeExecutionSummary) {
     return structuredClone({
          info,
          executedAt: summary.executedAt,
          duration: summary.duration,
          success: summary.success,
          requestSuccessCount: summary.requestSuccessCount,
          requestFailureCount: summary.requestFailureCount,
          requestErrorCount: summary.requestErrorCount,
          testPassCount: summary.testPassCount,
          testFailCount: summary.testFailCount
     })
}

export function executionResultFromRequest(info: ExecutionResultInfo, request: ApicizeRequest, execution?: ApicizeExecution): ExecutionResult {
     return structuredClone({
          info,
          executedAt: request.executedAt,
          duration: request.duration,
          request: execution?.request,
          response: execution?.response,
          inputVariables: execution?.inputVariables,
          data: execution?.data,
          outputVariables: execution?.outputVariables,
          tests: execution?.tests,
          error: execution?.error,
          success: request.success,
          requestSuccessCount: request.requestSuccessCount,
          requestFailureCount: request.requestFailureCount,
          requestErrorCount: request.requestErrorCount,
          testPassCount: request.testPassCount,
          testFailCount: request.testFailCount
     })
}

export function executionResultFromExecution(info: ExecutionResultInfo, execution: ApicizeExecution): ExecutionResult {
     return structuredClone({
          info,
          executedAt: execution.executedAt,
          duration: execution.duration,
          request: execution?.request,
          response: execution?.response,
          inputVariables: execution?.inputVariables,
          data: execution?.data,
          outputVariables: execution?.outputVariables,
          tests: execution?.tests,
          error: execution?.error,
          success: execution.success,
          testPassCount: execution.testPassCount,
          testFailCount: execution.testFailCount
     })
}

export type InfoColorType = OverridableStringUnion<
     | 'inherit'
     | 'success'
     | 'warning'
     | 'error'
     | 'disabled'
     | 'private'
     | 'vault',
     SvgIconPropsColorOverrides>


