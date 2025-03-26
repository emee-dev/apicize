import { Selection, Body, BodyType, GroupExecution, Method, NameValuePair, Request } from "@apicize/lib-typescript"
import { Editable, EditableItem, EditableState } from "../editable"
import { action, computed, get, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"
import { js_beautify } from 'js-beautify'
import { WorkspaceStore } from "../../contexts/workspace.context"
import { base64Encode, base64Decode } from "../../services/apicize-serializer"
import { DEFAULT_SELECTION_ID, NO_SELECTION_ID, NO_SELECTION } from "../store"
import { EditableRequestGroup } from "./editable-request-group"
import { EditableRequestEntry } from "./editable-request-entry"
export class EditableRequest extends EditableRequestEntry {
    public readonly entityType = EditableEntityType.Request

    @observable public accessor url = ''

    @observable public accessor method = Method.Get
    @observable public accessor timeout = 30000
    @observable public accessor keepalive = false as boolean | undefined
    @observable public accessor headers: EditableNameValuePair[] = []
    @observable public accessor queryStringParams: EditableNameValuePair[] = []
    @observable public accessor body: Body = { type: BodyType.None, data: undefined }
    @observable public accessor redirect = undefined
    // @observable public accessor integrity = undefined
    @observable public accessor mode = undefined
    @observable public accessor referrer = undefined
    @observable public accessor referrerPolicy = undefined
    @observable public accessor duplex = undefined
    @observable public accessor test = ''

    public constructor(entry: Request, workspace: WorkspaceStore) {
        super(workspace)
        this.id = entry.id
        this.name = entry.name ?? ''

        this.runs = entry.runs
        this.multiRunExecution = entry.multiRunExecution

        this.selectedScenario = entry.selectedScenario ?? undefined
        this.selectedAuthorization = entry.selectedAuthorization ?? undefined
        this.selectedCertificate = entry.selectedCertificate ?? undefined
        this.selectedProxy = entry.selectedProxy ?? undefined

        this.url = entry.url ?? ''
        this.method = entry.method ?? Method.Get
        this.timeout = entry.timeout ?? 30000
        this.keepalive = entry.keepalive
        this.headers = entry.headers?.map(h => ({
            id: GenerateIdentifier(),
            ...h
        })) ?? []
        this.queryStringParams = entry.queryStringParams?.map(q => ({
            id: GenerateIdentifier(),
            ...q
        })) ?? []

        let idxQuery = this.url.indexOf('?')
        if (idxQuery !== -1) {
            const params = new URLSearchParams(this.url.substring(idxQuery + 1))
            for (const [name, value] of params) {
                this.queryStringParams.push({
                    id: GenerateIdentifier(),
                    name,
                    value
                })
            }
            this.url = this.url.substring(0, idxQuery)
        }

        this.body = (entry.body && entry.body.data)
            ? entry.body
            : {
                type: BodyType.None,
                data: undefined
            }

        this.test = entry.test ?? ''
        this.warnings = entry.warnings
            ? new Map(entry.warnings.map(w => [GenerateIdentifier(), w]))
            : new Map<string, string>()
    }

    static fromWorkspace(entry: Request, workspace: WorkspaceStore): EditableRequest {
        return new EditableRequest(entry, workspace)
    }

    toWorkspace(): Request {
        const result: Request = {
            id: this.id,
            name: this.name,
            url: this.url,
            method: this.method,
            headers: toJS(this.headers),
            queryStringParams: toJS(this.queryStringParams),
            body: (this.body && this.body.type !== BodyType.None)
                ? toJS(this.body)
                : undefined,
            test: this.test,
            duplex: this.duplex,
            // integrity: this.integrity,
            keepalive: this.keepalive,
            mode: this.mode,
            runs: this.runs,
            timeout: this.timeout,
            multiRunExecution: this.multiRunExecution,
            selectedScenario: this.selectedScenario,
            selectedAuthorization: this.selectedAuthorization,
            selectedCertificate: this.selectedCertificate,
            selectedProxy: this.selectedProxy,
        }

        if (result.body?.type === BodyType.None) {
            result.body = undefined
        }

        if ((result.headers?.length ?? 0) === 0) {
            delete result.headers
        } else {
            result.headers?.forEach(h => delete (h as unknown as any).id)
        }
        if ((result.queryStringParams?.length ?? 0) === 0) {
            delete result.queryStringParams
        } else {
            result.queryStringParams?.forEach(p => delete (p as unknown as any).id)
        }
        return result
    }

    @action
    setUrl(value: string) {
        this.url = value
        this.markAsDirty()
    }

    @action
    setMethod(value: Method) {
        this.method = value
        this.markAsDirty()
    }

    @action
    setTimeout(value: number) {
        this.timeout = value
        this.markAsDirty()
    }

    @action
    setQueryStringParams(value: EditableNameValuePair[] | undefined) {
        this.queryStringParams = value ?? []
        this.markAsDirty()
    }

    @action
    setHeaders(value: EditableNameValuePair[] | undefined) {
        this.headers = value ?? []
        this.markAsDirty()
    }

    @action
    setBodyType(value: BodyType | undefined) {
        let newBody: Body
        if (this.body && this.body.data) {
            switch (value) {
                case BodyType.Raw:
                    switch (this.body.type) {
                        case BodyType.Form:
                            newBody = {
                                type: BodyType.Raw, data: (new TextEncoder()).encode(
                                    encodeFormData(this.body.data as EditableNameValuePair[])
                                )
                            }
                            break
                        case BodyType.XML:
                        case BodyType.JSON:
                        case BodyType.Text:
                            newBody = { type: BodyType.Raw, data: (new TextEncoder()).encode(this.body.data) }
                            break
                        case BodyType.Raw:
                            newBody = { type: BodyType.Raw, data: this.body.data }
                            break
                        default:
                            newBody = {
                                type: BodyType.Raw, data: new Uint8Array()
                            }
                    }
                    break
                case BodyType.Form:
                    switch (this.body.type) {
                        case BodyType.JSON:
                        case BodyType.XML:
                        case BodyType.Text:
                            newBody = {
                                type: BodyType.Form,
                                data: decodeFormData(this.body.data)
                            }
                            break
                        case BodyType.Raw:
                            newBody = {
                                type: BodyType.Form,
                                data: decodeFormData(new TextDecoder().decode(this.body.data))
                            }
                            break
                        case BodyType.Form:
                            newBody = { type: BodyType.Form, data: this.body.data }
                            break
                        default:
                            newBody = {
                                type: BodyType.Form, data: []
                            }
                            break
                    }
                    break
                case BodyType.JSON:
                case BodyType.XML:
                case BodyType.Text:
                    switch (this.body.type) {
                        case BodyType.JSON:
                        case BodyType.XML:
                        case BodyType.Text:
                            newBody = { type: value, data: this.body.data }
                            break
                        case BodyType.Raw:
                            newBody = { type: value, data: (new TextDecoder()).decode(this.body.data) }
                            break
                        default:
                            newBody = { type: BodyType.None, data: undefined }
                            break
                    }
                    break
                case BodyType.None:
                default:
                    newBody = {
                        type: BodyType.None,
                        data: undefined
                    }

            }
        } else {
            switch (value) {
                case BodyType.Form:
                    newBody = {
                        type: BodyType.Form,
                        data: []
                    }
                    break
                case BodyType.XML:
                case BodyType.JSON:
                case BodyType.Text:
                    newBody = {
                        type: value,
                        data: ''
                    }
                    break
                case BodyType.None:
                default:
                    newBody = {
                        type: BodyType.None,
                        data: undefined
                    }
                    break
            }

        }

        this.body = newBody
        this.markAsDirty()
    }

    @action
    setBody(body: Body) {
        this.body = body
        this.markAsDirty()
    }

    @action
    setBodyData(value: string | EditableNameValuePair[]) {
        this.body.data = value
        this.markAsDirty()
    }

    @action
    setTest(value: string | undefined) {
        this.test = value ?? ''
        this.markAsDirty()
    }

    @computed get urlInvalid() {
        return this.dirty && this.url.length == 0
    }

    @computed get state() {
        return (this.dirty && (this.nameInvalid || this.urlInvalid))
            || (this.warnings?.size ?? 0) > 0
            ? EditableState.Warning
            : EditableState.None
    }
}


const encodeFormData = (data: EditableNameValuePair[]) =>
    (data.length === 0)
        ? ''
        : data.map(nv =>
            `${encodeURIComponent(nv.name)}=${encodeURIComponent(nv.value)}`
        ).join('&')

const decodeFormData = (bodyData: string | number[] | undefined) => {
    let data: string | undefined;
    if (bodyData instanceof Array) {
        const buffer = Uint8Array.from(bodyData)
        data = (new TextDecoder()).decode(buffer)
    } else {
        data = bodyData
    }
    if (data && data.length > 0) {
        const parts = data.split('&')
        return parts.map(p => {
            const id = GenerateIdentifier()
            const nv = p.split('=')
            if (nv.length == 1) {
                return { id, name: decodeURIComponent(nv[0]), value: "" } as EditableNameValuePair
            } else {
                return { id, name: decodeURIComponent(nv[0]), value: decodeURIComponent(nv[1]) } as EditableNameValuePair
            }
        })
    } else {
        return []
    }
}
