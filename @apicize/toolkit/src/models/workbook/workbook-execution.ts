import { ApicizeExecutionGroup, ApicizeExecutionGroupRun, ApicizeExecutionItem, ApicizeExecutionRequest, ApicizeExecutionRequestRun, ApicizeHttpResponse, ApicizeRequest, ApicizeTestResult } from "@apicize/lib-typescript";
import { OverridableStringUnion } from '@mui/types'
import { SvgIconPropsColorOverrides } from "@mui/material"

export interface WorkbookExecutionResponse {
     status: number
     statusText: string
}


export interface WorkbookExecutionMenuItem {
     executionResultId: string
     title: string
     level: number
}

export type WorkbookExecutionResult = WorkbookExecutionRequest | WorkbookExecutionGroup

export interface WorkbookExecutionRequest extends ApicizeExecutionRequestRun {
     type: 'request'
     id: string
     name: string
     run: number
     numberOfRuns: number
}

export interface WorkbookExecutionGroup {
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

export interface WorkbookExecution {
     requestOrGroupId: string
     running: boolean
     panel: string
     resultIndex: number
     resultMenu: WorkbookExecutionMenuItem[]
     results: Map<string, WorkbookExecutionResult>
}

export type InfoColorType = OverridableStringUnion<
     | 'inherit'
     | 'success'
     | 'warning'
     | 'error'
     | 'disabled',
     SvgIconPropsColorOverrides>
