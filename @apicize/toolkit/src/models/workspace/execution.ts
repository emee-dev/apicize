import { ApicizeBody, ApicizeError, ApicizeExecution, ApicizeExecutionType, ApicizeGroup, ApicizeGroupRun, ApicizeRequest, ApicizeResponse, ApicizeRow, ApicizeTestResult } from "@apicize/lib-typescript";
import { OverridableStringUnion } from '@mui/types'
import { SvgIconPropsColorOverrides } from "@mui/material"

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

     request?: {
          url: string,
          method: string
          headers: Map<string, string>
          body?: ApicizeBody
          variables?: Map<string, string | number | boolean>
     }

     execution?: {
          response?: ApicizeResponse
          tests?: ApicizeTestResult[]
          error?: ApicizeError
     }

     success: boolean
     requestSuccessCount?: number
     requestFailureCount?: number
     requestErrorCount?: number
     passedTestCount: number
     failedTestCount: number
}
export interface Execution {
     requestOrGroupId: string
     running: boolean
     panel: string
     resultIndex: number
     resultMenu: ExecutionMenuItem[]
     results: ExecutionResult[]
}

export function executionResultFromSummary(info: ExecutionResultInfo, summary: ApicizeGroup | ApicizeGroupRun | ApicizeRow): ExecutionResult {
     return structuredClone({
          info,
          executedAt: summary.executedAt,
          duration: summary.duration,
          success: summary.success,
          requestSuccessCount: summary.requestSuccessCount,
          requestFailureCount: summary.requestFailureCount,
          requestErrorCount: summary.requestErrorCount,
          passedTestCount: summary.passedTestCount,
          failedTestCount: summary.failedTestCount
     })
}

export function executionResultFromRequest(info: ExecutionResultInfo, request: ApicizeRequest, execution?: ApicizeExecution): ExecutionResult {
     return structuredClone({
          info,
          executedAt: request.executedAt,
          duration: request.duration,
          request: execution ? {
               url: execution.url,
               method: execution.method,
               headers: execution.headers,
               body: execution.body,
               variables: execution.variables,
          } : undefined,
          execution: execution ? {
               response: execution.response,
               tests: execution.tests,
               error: execution.error,
          } : undefined,
          success: request.success,
          requestSuccessCount: request.requestSuccessCount,
          requestFailureCount: request.requestFailureCount,
          requestErrorCount: request.requestErrorCount,
          passedTestCount: request.passedTestCount,
          failedTestCount: request.failedTestCount
     })
}

export function executionResultFromExecution(info: ExecutionResultInfo, execution: ApicizeExecution): ExecutionResult {
     return structuredClone({
          info,
          executedAt: execution.executedAt,
          duration: execution.duration,
          request: {
               url: execution.url,
               method: execution.method,
               headers: execution.headers,
               body: execution.body,
               variables: execution.variables,
          },
          execution: {
               response: execution.response,
               tests: execution.tests,
               error: execution.error,
          },
          success: execution.success,
          passedTestCount: execution.passedTestCount,
          failedTestCount: execution.failedTestCount
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


