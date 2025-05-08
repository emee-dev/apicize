import { Selection, BodyType, GroupExecution, Method, NameValuePair, Request, RequestGroup, BaseRequest } from "@apicize/lib-typescript"
import { EditableState } from "../editable"
import { action, computed, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EntityType } from "./entity-type"
import { EntityRequest, WorkspaceStore } from "../../contexts/workspace.context"
import { EditableRequestEntry } from "./editable-request-entry"
import { RequestDuplex } from "undici-types"

export class EditableRequest extends EditableRequestEntry {
    public readonly entityType = EntityType.Request

    @observable public accessor url = ''

    @observable public accessor method = Method.Get
    @observable public accessor timeout = 30000
    @observable public accessor keepalive = false as boolean | undefined
    @observable public accessor headers: EditableNameValuePair[] = []
    @observable public accessor queryStringParams: EditableNameValuePair[] = []
    // @observable public accessor body: Body = { type: BodyType.None, data: undefined }
    @observable public accessor test = ''
    @observable public accessor redirect: RequestRedirect | undefined = undefined
    @observable public accessor mode: RequestMode | undefined = undefined
    @observable public accessor referrer: string | undefined = undefined
    @observable public accessor referrerPolicy: ReferrerPolicy | undefined = undefined
    @observable public accessor duplex: RequestDuplex | undefined = undefined

    public constructor(entry: BaseRequest, workspace: WorkspaceStore) {
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

        this.test = entry.test ?? ''

        this.mode = entry.mode
        this.referrer = entry.referrer
        this.referrerPolicy = entry.referrerPolicy
        this.duplex = entry.duplex

        this.warnings = entry.warnings
            ? new Map(entry.warnings.map(w => [GenerateIdentifier(), w]))
            : new Map<string, string>()
    }

    protected onUpdate() {
        this.markAsDirty()

        const request: EntityRequest = {
            entityType: 'Request',
            id: this.id,
            name: this.name,
            url: this.url,
            method: this.method,
            headers: toJS(this.headers),
            queryStringParams: toJS(this.queryStringParams),
            // body: (this.body && this.body.type !== BodyType.None)
            //     ? toJS(this.body)
            //     : undefined,
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
        if ((request.headers?.length ?? 0) === 0) {
            delete request.headers
        } else {
            request.headers?.forEach(h => delete (h as unknown as any).id)
        }
        if ((request.queryStringParams?.length ?? 0) === 0) {
            delete request.queryStringParams
        } else {
            request.queryStringParams?.forEach(p => delete (p as unknown as any).id)
        }

        this.workspace.updateRequest(request)
    }

    @action
    setUrl(value: string) {
        this.url = value
        this.onUpdate()
    }

    @action
    setMethod(value: Method) {
        this.method = value
        this.onUpdate()
    }

    @action
    setTimeout(value: number) {
        this.timeout = value
        this.onUpdate()
    }

    @action
    setQueryStringParams(value: EditableNameValuePair[] | undefined) {
        this.queryStringParams = value ?? []
        this.onUpdate()
    }

    @action
    setHeaders(value: EditableNameValuePair[] | undefined) {
        this.headers = value ?? []
        this.onUpdate()
    }

    @action
    setTest(value: string | undefined) {
        this.test = value ?? ''
        this.onUpdate()
    }

    @action
    refreshFromExternalUpdate(entity: EntityRequest) {
        this.name = entity.name ?? ''
        this.url = entity.url
        this.method = entity.method
        this.timeout = entity.timeout
        this.keepalive = entity.keepalive
        this.mode = entity.mode
        this.runs = entity.runs
        this.multiRunExecution = entity.multiRunExecution
        this.headers = entity.headers?.map((h) => ({ id: GenerateIdentifier(), ...h })) ?? []
        this.queryStringParams = entity.queryStringParams?.map((q) => ({ id: GenerateIdentifier(), ...q })) ?? []
        this.redirect = entity.redirect
        this.referrer = entity.referrer
        this.referrerPolicy = entity.referrerPolicy
        this.duplex = entity.duplex
        this.test = entity.test ?? ''
        this.selectedScenario = entity.selectedScenario
        this.selectedAuthorization = entity.selectedAuthorization
        this.selectedCertificate = entity.selectedCertificate
        this.selectedProxy = entity.selectedProxy
        this.warnings = entity.warnings
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

/**
 * This is all request information, excluding the request body
 */
export interface RequestInfo {
    id: string
    name: string
    url: string
    method: Method
    timeout: number
    keepalive?: boolean
    mode?: RequestMode
    runs: number
    multiRunExecution: GroupExecution
    headers?: NameValuePair[]
    queryStringParams?: NameValuePair[]
    redirect?: RequestRedirect
    referrer?: string
    referrerPolicy?: ReferrerPolicy
    duplex?: RequestDuplex
    test?: string,
    selectedScenario?: Selection,
    selectedAuthorization?: Selection,
    selectedCertificate?: Selection,
    selectedProxy?: Selection,
    warnings?: Map<string, string>
}

export interface RequestEntryInfo {
    request?: RequestInfo
    group?: RequestGroup
}
