import { ApicizeExecutedTestResponse, ApicizeExecutionRun, ApicizeRequest, ApicizeResponse, ApicizeTestResult } from "@apicize/lib-typescript";
import { OverridableStringUnion } from '@mui/types'
import { SvgIconPropsColorOverrides } from "@mui/material"

export interface WorkbookExecutionResponse {
     status: number
     statusText: string
}

export type WorkbookExecutionResult = WorkbookExecutionGroupResult | WorkbookExecutionRequestResult

export interface WorkbookExecutionGroupResult {
     type: 'group'
     name: string
     executedAt: number
     duration: number
     requestsWithPassedTestsCount: number
     requestsWithFailedTestsCount: number
     requestsWithErrors: number
     passedTestCount: number
     failedTestCount: number
     items?: WorkbookExecutionGroupItem[]
 }

export interface WorkbookExecutionGroupItem {
     name: string
     executedAt: number
     duration: number
     errorMessage?: string
     tests?: ApicizeTestResult[]
     children?: WorkbookExecutionGroupItem[]
}

export interface WorkbookExecutionRequestResult {
     type: 'request'
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
     requestsWithPassedTestsCount: number
     requestsWithFailedTestsCount: number
     requestsWithErrors: number
     longTextInResponse: boolean
     disableOtherPanels: boolean

}

export interface WorkbookExecutionRun {
     title: string
     results: WorkbookExecutionResult[]
}

export interface WorkbookExecutionResultMenuItem {
     requestOrGroupId: string
     title: string
     index: number
}

export interface WorkbookExecutionRunMenuItem {
     title: string,
     results: WorkbookExecutionResultMenuItem[]
}

export interface WorkbookExecution {
     requestOrGroupId: string
     running: boolean
     runIndex: number
     resultIndex: number
     runs: WorkbookExecutionRunMenuItem[]
     panel: string
     results: WorkbookExecutionResult[]
}

export type InfoColorType = OverridableStringUnion<
     | 'inherit'
     | 'success'
     | 'warning'
     | 'error'
     | 'disabled',
     SvgIconPropsColorOverrides>
