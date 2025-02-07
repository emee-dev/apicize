import { ApicizeExecution, ApicizeExecutionRequestRun } from "@apicize/lib-typescript";
import { OverridableStringUnion } from '@mui/types'
import { SvgIconPropsColorOverrides } from "@mui/material"

export interface ExecutionResponse {
     status: number
     statusText: string
}


export interface ExecutionMenuItem {
     executionResultId: string
     title: string
     level: number
}

export type ExecutionResult = ExecutionRequest | ExecutionGroup

export interface ExecutionRequest extends ApicizeExecutionRequestRun {
     type: 'request'
     id: string
     name: string
     run: number
     numberOfRuns: number
}

export interface ExecutionGroup {
     childExecutionIDs: string[]
     type: 'group'
     id: string
     name: string
     runNumber: number
     numberOfRuns: number
     executedAt: number
     duration: number
     success: boolean
     requestsWithPassedTestsCount: number
     requestsWithFailedTestsCount: number
     requestsWithErrors: number
     passedTestCount: number
     failedTestCount: number
}

export interface Execution {
     requestOrGroupId: string
     running: boolean
     panel: string
     resultIndex: number
     resultMenu: ExecutionMenuItem[]
     results: Map<string, ExecutionResult>
     response?: ApicizeExecution
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
