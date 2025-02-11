import { Selection, Body, BodyType, GroupExecution, Method, NameValuePair, Request, RequestGroup } from "@apicize/lib-typescript"
import { Editable, EditableItem, EditableState } from "../editable"
import { computed, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"

export class EditableRequest extends Editable<Request> {
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
    @observable public accessor warnings: Map<string, string> | undefined = undefined

    @observable accessor runs = 0
    @observable public accessor multiRunExecution = GroupExecution.Sequential

    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined

    static fromWorkspace(entry: Request): EditableRequest {
        const result = new EditableRequest()
        result.id = entry.id
        result.name = entry.name ?? ''

        result.runs = entry.runs
        result.multiRunExecution = entry.multiRunExecution

        result.selectedScenario = entry.selectedScenario ?? undefined
        result.selectedAuthorization = entry.selectedAuthorization ?? undefined
        result.selectedCertificate = entry.selectedCertificate ?? undefined
        result.selectedProxy = entry.selectedProxy ?? undefined

        result.url = entry.url ?? ''
        result.method = entry.method ?? Method.Get
        result.timeout = entry.timeout ?? 30000
        result.keepalive = entry.keepalive
        result.headers = entry.headers?.map(h => ({
            id: GenerateIdentifier(),
            ...h
        })) ?? []
        result.queryStringParams = entry.queryStringParams?.map(q => ({
            id: GenerateIdentifier(),
            ...q
        })) ?? []

        let idxQuery = result.url.indexOf('?')
        if (idxQuery !== -1) {
            const params = new URLSearchParams(result.url.substring(idxQuery + 1))
            for (const [name, value] of params) {
                result.queryStringParams.push({
                    id: GenerateIdentifier(),
                    name,
                    value
                })
            }
            result.url = result.url.substring(0, idxQuery)
        }

        result.body = entry.body ?? { type: BodyType.None, data: undefined }
        if (result.body && result.body.data) {
            switch (result.body.type) {
                case BodyType.JSON:
                    result.body.data = result.body.formatted
                        ? result.body.formatted
                        : JSON.stringify(result.body.data)
                    break
                case BodyType.Form:
                    result.body.data = (result.body.data as NameValuePair[]).map(r => ({
                        id: GenerateIdentifier(),
                        ...r
                    }))
                    break
            }
        } else {
            result.body = {
                type: BodyType.None,
                data: undefined
            }
        }
        result.test = entry.test ?? ''
        result.warnings = entry.warnings
            ? new Map(entry.warnings.map(w => [GenerateIdentifier(), w]))
            : new Map<string, string>()

        return result
    }

    toWorkspace(): Request {
        if (this.body.type === BodyType.JSON && this.body.data) {
            this.body.formatted = this.body.data
        }

        const result: Request = {
            id: this.id,
            name: this.name,
            url: this.url,
            method: this.method,
            headers: toJS(this.headers),
            queryStringParams: toJS(this.queryStringParams),
            body: toJS(this.body),
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

        let bodyIsValid = false
        if (result.body?.data) {
            switch (result.body?.type) {
                case BodyType.Form:
                    const bodyAsForm = result.body.data as EditableNameValuePair[]
                    bodyIsValid = bodyAsForm.length > 0
                    if (bodyIsValid) {
                        result.body = {
                            type: BodyType.Form,
                            data: bodyAsForm.map(pair => ({
                                name: pair.name,
                                value: pair.value,
                                disabled: pair.disabled
                            }))
                        }
                    }
                    break
                case BodyType.JSON:
                    if (typeof result.body.data === 'string') {
                        try {
                            result.body.data = JSON.parse(result.body.data)
                            bodyIsValid = true
                        } catch (e) {
                            throw new Error(`Invalid JSON data - ${(e as Error).message}`)
                        }
                    }
                    break
                default:
                    const bodyAsText = result.body.data as string
                    bodyIsValid = bodyAsText.length > 0
                    if (bodyIsValid) {
                        result.body = {
                            type: result.body.type,
                            data: bodyAsText
                        }
                    }
                    break
            }
        }
        if (!bodyIsValid) {
            delete result.body
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

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get urlInvalid() {
        return ! /^(\{\{.+\}\}|https?:\/\/)(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?$/.test(this.url)
    }

    @computed get state() {
        return this.nameInvalid
            || this.urlInvalid
            || (this.warnings?.size ?? 0) > 0
            ? EditableState.Warning
            : EditableState.None
    }
}

export class EditableRequestGroup extends Editable<RequestGroup> {
    public readonly entityType = EditableEntityType.Group

    @observable public accessor execution = GroupExecution.Sequential

    @observable accessor runs = 0
    @observable accessor timeout = 0
    @observable public accessor multiRunExecution = GroupExecution.Sequential

    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined
    @observable accessor warnings: Map<string, string> | undefined = undefined

    static fromWorkspace(entry: RequestGroup): EditableRequestGroup {
        const result = new EditableRequestGroup()
        result.id = entry.id
        result.name = entry.name ?? ''

        result.execution = entry.execution
        result.multiRunExecution = entry.multiRunExecution

        result.runs = entry.runs
        result.selectedScenario = entry.selectedScenario ?? undefined
        result.selectedAuthorization = entry.selectedAuthorization ?? undefined
        result.selectedCertificate = entry.selectedCertificate ?? undefined
        result.selectedProxy = entry.selectedProxy ?? undefined
        result.warnings = entry.warnings
            ? new Map(entry.warnings.map(w => [GenerateIdentifier(), w]))
            : new Map<string, string>()

        return result
    }

    toWorkspace(): RequestGroup {
        return {
            id: this.id,
            name: this.name,
            runs: this.runs,
            execution: this.execution,
            multiRunExecution: this.multiRunExecution,
            selectedScenario: this.selectedScenario ?? undefined,
            selectedAuthorization: this.selectedAuthorization ?? undefined,
            selectedCertificate: this.selectedCertificate ?? undefined,
            selectedProxy: this.selectedProxy ?? undefined,
        } as RequestGroup
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get state() {
        return this.nameInvalid || (this.warnings?.size ?? 0) > 0
            ? EditableState.Warning
            : EditableState.None
    }
}
