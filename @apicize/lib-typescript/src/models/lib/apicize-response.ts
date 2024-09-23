import { WorkbookBody } from "../workbook/workbook-request"

export interface ApicizeResponseBody {
    data?: string
    text?: string
}

export interface ApicizeResponse {
    status: number
    statusText: string
    headers?: {[name: string]: string }
    body?: ApicizeResponseBody
    logs?: string
    authTokenCached?: boolean
}