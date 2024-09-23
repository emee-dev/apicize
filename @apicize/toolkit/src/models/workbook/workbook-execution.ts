import { ApicizeResult, ApicizeTestResult } from "@apicize/lib-typescript";
import { OverridableStringUnion } from '@mui/types'
import { SvgIconPropsColorOverrides } from "@mui/material"

export interface WorkbookExecutionResponse {
     status: number
     statusText: string
}

export interface WorkbookExecutionGroupSummaryRequest {
     status?: number
     statusText?: string
     milliseconds: number,
     requestName: string,
     tests?: ApicizeTestResult[] 
     errorMessage?: string
}

export interface WorkbookExecutionGroupSummary {
     success: boolean
     executedAt: number
     milliseconds: number
     allTestsSucceeded: boolean
     requests?: WorkbookExecutionGroupSummaryRequest[]
     infoColor: InfoColorType
}

export interface WorkbookExecutionResult extends ApicizeResult {
     longTextInResponse: boolean
     infoColor: InfoColorType
     disableOtherPanels: boolean
     hasRequest: boolean
}

export interface WorkbookExecutionRun {
     title: string
     results: WorkbookExecutionResult[]
}

export interface WorkbookExecutionResultMenuItem {
     index: number, // -1 = summary for group
     title: string,
}

export interface WorkbookExecutionRunMenuItem {
     title: string,
     results: WorkbookExecutionResultMenuItem[]
     groupSummary?: WorkbookExecutionGroupSummary
}

export interface WorkbookExecution {
     running: boolean
     runIndex: number
     resultIndex: number
     runs: WorkbookExecutionRunMenuItem[]

     panel: string
     results: Map<string, WorkbookExecutionResult>
}

export type InfoColorType = OverridableStringUnion<
     | 'inherit'
     | 'success'
     | 'warning'
     | 'error'
     | 'disabled',
     SvgIconPropsColorOverrides>
