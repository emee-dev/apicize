import { Identifiable } from '../identifiable';
import { Named } from '../named';
import {
    ReferrerPolicy,
    RequestDuplex,
    RequestMode,
    RequestRedirect
} from 'undici-types'
import { Executable } from '../executable';

/**
 * Used to represent headers, query string parameters, etc.
 */
export interface WorkbookNameValuePair {
    name: string
    value: string
    disabled?: boolean
}

export enum WorkbookMethod {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Patch = 'PATCH',
    Head = 'HEAD',
    Options = 'OPTIONS'
}

export const WorkbookMethods = [
    WorkbookMethod.Get,
    WorkbookMethod.Post,
    WorkbookMethod.Put,
    WorkbookMethod.Delete,
    WorkbookMethod.Patch,
    WorkbookMethod.Head,
    WorkbookMethod.Options
]

export enum WorkbookBodyType {
    None = 'None',
    Text = 'Text',
    JSON = 'JSON',
    XML = 'XML',
    Form = 'Form',
    Raw = 'Raw',
}

export type WorkbookBodyData = string | WorkbookNameValuePair[]

export const WorkbookBodyTypes = [WorkbookBodyType.None, WorkbookBodyType.Text, WorkbookBodyType.JSON,
    WorkbookBodyType.XML, WorkbookBodyType.Form, WorkbookBodyType.Raw]

export interface WorkbookBody {
    type?: WorkbookBodyType
    data?: WorkbookBodyData
}

export type WorkbookRequestEntry = WorkbookRequest | WorkbookRequestGroup

export interface WorkbookRequest extends Identifiable, Named, Executable {
    url: string
    method?: WorkbookMethod
    timeout?: number
    keepalive?: boolean
    headers?: WorkbookNameValuePair[]
    queryStringParams?: WorkbookNameValuePair[]
    body?: WorkbookBody
    redirect?: RequestRedirect
    integrity?: string
    mode?: RequestMode
    referrer?: string
    referrerPolicy?: ReferrerPolicy
    duplex?: RequestDuplex
    test?: string
}

export enum WorkbookGroupExecution {
    Sequential = "SEQUENTIAL",
    Concurrent= "CONCURRENT",
}

export interface WorkbookRequestGroup extends Identifiable, Named, Executable {
    execution: WorkbookGroupExecution
}