import { Identifiable } from './identifiable';
import { Named } from './named';
import {
    ReferrerPolicy,
    RequestDuplex,
    RequestMode,
    RequestRedirect
} from 'undici-types'
import { Executable } from './executable';
import { NameValuePair } from './name-value-pair';
import { SelectedParameters } from './selected-parameters';

export enum Method {
    Get = 'GET',
    Post = 'POST',
    Put = 'PUT',
    Delete = 'DELETE',
    Patch = 'PATCH',
    Head = 'HEAD',
    Options = 'OPTIONS'
}

export const Methods = [
    Method.Get,
    Method.Post,
    Method.Put,
    Method.Delete,
    Method.Patch,
    Method.Head,
    Method.Options
]

export enum BodyType {
    None = 'None',
    Text = 'Text',
    JSON = 'JSON',
    XML = 'XML',
    Form = 'Form',
    Raw = 'Raw',
}

export type BodyData = string | NameValuePair[]

export const BodyTypes = [BodyType.None, BodyType.Text, BodyType.JSON,
BodyType.XML, BodyType.Form, BodyType.Raw]

export type Body = BodyNone | BodyJSON | BodyXML | BodyText | BodyForm | BodyRaw

export interface BodyNone {
    type: BodyType.None
    data: undefined
}

export interface BodyJSON {
    type: BodyType.JSON
    data: string
}

export interface BodyXML {
    type: BodyType.XML
    data: string
}

export interface BodyText {
    type: BodyType.Text
    data: string
}

export interface BodyForm {
    type: BodyType.Form
    data: NameValuePair[]
}

export interface BodyRaw {
    type: BodyType.Raw
    data: Uint8Array
}

export type RequestEntry = Request | RequestGroup


export interface BaseRequest extends Identifiable, Named, SelectedParameters, Executable {
    url: string
    method?: Method
    timeout?: number
    keepalive?: boolean
    headers?: NameValuePair[]
    queryStringParams?: NameValuePair[]
    redirect?: RequestRedirect
    // integrity?: string
    mode?: RequestMode
    referrer?: string
    referrerPolicy?: ReferrerPolicy
    duplex?: RequestDuplex
    test?: string,
    warnings?: string[],    
}

export interface Request extends BaseRequest {
    body?: Body 
}

export enum GroupExecution {
    Sequential = "SEQUENTIAL",
    Concurrent = "CONCURRENT",
}

export interface RequestGroup extends Identifiable, Named, SelectedParameters, Executable {
    execution: GroupExecution
    warnings?: string[],
}
