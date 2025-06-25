import { Selection, BodyType, GroupExecution, Method, NameValuePair, Request, RequestGroup, BaseRequest, Warnings, ValidationErrors } from "@apicize/lib-typescript"
import { action, computed, observable, reaction, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EntityType } from "./entity-type"
import { EntityRequest, WorkspaceStore } from "../../contexts/workspace.context"
import { EditableRequestEntry } from "./editable-request-entry"
import { RequestDuplex } from "undici-types"
import { EditableWarnings } from "./editable-warnings"
import { monaco } from "react-monaco-editor"

export class EditableRequest extends EditableRequestEntry {
    public readonly entityType = EntityType.Request

    @observable public accessor url = ''

    @observable public accessor method = Method.Get
    @observable public accessor timeout = 30000
    @observable public accessor keepAlive = false
    @observable public accessor acceptInvalidCerts = false
    @observable public accessor numberOfRedirects = 10
    // @observable public accessor headers: EditableNameValuePair[] = []
    @observable public accessor queryStringParams: EditableNameValuePair[] = []
    // @observable public accessor body: Body = { type: BodyType.None, data: undefined }
    @observable public accessor test = ''
    @observable public accessor redirect: RequestRedirect | undefined = undefined
    @observable public accessor mode: RequestMode | undefined = undefined
    @observable public accessor referrer: string | undefined = undefined
    @observable public accessor referrerPolicy: ReferrerPolicy | undefined = undefined
    @observable public accessor duplex: RequestDuplex | undefined = undefined
    @observable accessor warnings = new EditableWarnings()

    public constructor(entry: BaseRequest, workspace: WorkspaceStore) {
        super(workspace)

        console.log(`Creating request`, entry)

        this.id = entry.id
        this.name = entry.name ?? ''

        this.runs = entry.runs
        this.multiRunExecution = entry.multiRunExecution

        this.selectedScenario = entry.selectedScenario ?? undefined
        this.selectedAuthorization = entry.selectedAuthorization ?? undefined
        this.selectedCertificate = entry.selectedCertificate ?? undefined
        this.selectedProxy = entry.selectedProxy ?? undefined
        this.selectedData = entry.selectedData ?? undefined

        this.warnings.set(entry.warnings)

        this.url = entry.url ?? ''
        this.method = entry.method ?? Method.Get
        this.timeout = entry.timeout ?? 30000
        this.acceptInvalidCerts = entry.acceptInvalidCerts
        this.keepAlive = entry.keepAlive
        // this.headers = entry.headers?.map(h => ({
        //     id: GenerateIdentifier(),
        //     ...h
        // })) ?? []
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
    }

    public onUpdate() {
        this.markAsDirty()

        const request: EntityRequest = {
            entityType: 'Request',
            id: this.id,
            name: this.name,
            url: this.url,
            method: this.method,
            // headers: toJS(this.headers),
            queryStringParams: toJS(this.queryStringParams),
            // body: (this.body && this.body.type !== BodyType.None)
            //     ? toJS(this.body)
            //     : undefined,
            test: this.test,
            duplex: this.duplex,
            // integrity: this.integrity,
            keepAlive: this.keepAlive,
            acceptInvalidCerts: this.acceptInvalidCerts,
            numberOfRedirects: this.numberOfRedirects,
            mode: this.mode,
            runs: this.runs,
            timeout: this.timeout,
            multiRunExecution: this.multiRunExecution,
            selectedScenario: this.selectedScenario,
            selectedAuthorization: this.selectedAuthorization,
            selectedCertificate: this.selectedCertificate,
            selectedProxy: this.selectedProxy,
            selectedData: this.selectedData,
            warnings: this.warnings.hasEntries ? [...this.warnings.entries.values()] : undefined,
            validationErrors: this.validationErrors,
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
    setKeepAlive(value: boolean) {
        this.keepAlive = value
        this.onUpdate()
    }

    @action
    setAcceptInvalidCerts(value: boolean) {
        this.acceptInvalidCerts = value
        this.onUpdate()
    }

    @action
    setNumberOfRedirects(value: number) {
        if (value < 0) {
            throw new Error('Number of redirects must be zero (disabled) or greater')
        }
        this.numberOfRedirects = value
        this.onUpdate()
    }

    @action
    setQueryStringParams(value: EditableNameValuePair[] | undefined) {
        this.queryStringParams = value ?? []
        this.onUpdate()
    }

    // @action
    // setHeaders(value: EditableNameValuePair[] | undefined) {
    //     this.headers = value ?? []
    //     this.onUpdate()
    // }

    @action
    setTest(value: string | undefined) {
        this.test = value ?? ''
        this.onUpdate()
    }

    @action
    deleteWarning(id: string) {
        this.warnings.delete(id)
        this.onUpdate()
    }

    @action
    refreshFromExternalUpdate(entity: EntityRequest) {
        this.name = entity.name ?? ''
        this.url = entity.url
        this.method = entity.method
        this.timeout = entity.timeout
        this.keepAlive = entity.keepAlive
        this.acceptInvalidCerts = entity.acceptInvalidCerts
        this.mode = entity.mode
        this.runs = entity.runs
        this.multiRunExecution = entity.multiRunExecution
        // this.headers = entity.headers?.map((h) => ({ id: GenerateIdentifier(), ...h })) ?? []
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
        this.selectedData = entity.selectedData
        this.warnings.set(entity.warnings)
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get urlInvalid() {
        return this.url.length == 0
    }

    @computed get validationErrors(): { [property: string]: string } | undefined {
        const results: { [property: string]: string } = {}
        if (this.nameInvalid) {
            results.name = 'Name is required'
        }
        if (this.urlInvalid) {
            results.url = 'URL is required'
        }
        return Object.keys(results).length > 0 ? results : undefined
    }

}

/**
 * This is all request information, excluding the request body
 */
export interface RequestInfo extends Warnings, ValidationErrors {
    id: string
    name: string
    url: string
    method: Method
    timeout: number
    keepAlive: boolean
    acceptInvalidCerts: boolean
    numberOfRedirects: number
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
    selectedData?: Selection,
}

export interface RequestEntryInfo {
    request?: RequestInfo
    group?: RequestGroup
}
