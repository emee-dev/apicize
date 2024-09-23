import { Selection, WorkbookBody, WorkbookBodyType, WorkbookGroupExecution, WorkbookMethod, WorkbookNameValuePair, WorkbookRequest, WorkbookRequestGroup } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { computed, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"

export class EditableWorkbookRequest extends Editable<WorkbookRequest> {
    public readonly entityType = EditableEntityType.Request

    @observable public accessor url = ''

    @observable public accessor method = WorkbookMethod.Get
    @observable public accessor timeout = 30000
    @observable public accessor keepalive = false as boolean | undefined
    @observable public accessor headers: EditableNameValuePair[] = []
    @observable public accessor queryStringParams: EditableNameValuePair[] = []
    @observable public accessor body = { type: WorkbookBodyType.None } as WorkbookBody
    @observable public accessor redirect = undefined
    @observable public accessor integrity = undefined
    @observable public accessor mode = undefined
    @observable public accessor referrer = undefined
    @observable public accessor referrerPolicy = undefined
    @observable public accessor duplex = undefined
    @observable public accessor test = ''

    @observable accessor runs = 0
    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined

    static fromWorkspace(entry: WorkbookRequest): EditableWorkbookRequest {
        const result = new EditableWorkbookRequest()
        result.id = entry.id
        result.name = entry.name ?? ''

        result.runs = entry.runs
        result.selectedScenario = entry.selectedScenario ?? undefined
        result.selectedAuthorization = entry.selectedAuthorization ?? undefined
        result.selectedCertificate = entry.selectedCertificate ?? undefined
        result.selectedProxy = entry.selectedProxy ?? undefined

        result.url = entry.url ?? ''
        result.method = entry.method ?? WorkbookMethod.Get
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
        result.body = entry.body ?? { type: WorkbookBodyType.None }
        if (result.body && result.body.data) {
            switch (result.body.type) {
                case WorkbookBodyType.JSON:
                    result.body.data = JSON.stringify(result.body.data)
                    break
                case WorkbookBodyType.Form:
                    result.body.data = (result.body.data as WorkbookNameValuePair[]).map(r => ({
                        id: GenerateIdentifier(),
                        ...r
                    }))
                    break
            }
        } else {
            result.body = {
                type: WorkbookBodyType.None
            }
        }
        result.test = entry.test ?? ''

        return result
    }

    toWorkspace(): WorkbookRequest {
        const result: WorkbookRequest = {
            id: this.id,
            name: this.name,
            url: this.url,
            method: this.method,
            headers: toJS(this.headers),
            queryStringParams: toJS(this.queryStringParams),
            body: toJS(this.body),
            test: this.test,
            duplex: this.duplex,
            integrity: this.integrity,
            keepalive: this.keepalive,
            mode: this.mode,
            runs: this.runs,
            selectedScenario: this.selectedScenario,
            selectedAuthorization: this.selectedAuthorization,
            selectedCertificate: this.selectedCertificate,
            selectedProxy: this.selectedProxy,
        }

        let bodyIsValid = false
        if (result.body?.data) {
            switch (result.body?.type) {
                case WorkbookBodyType.Form:
                    const bodyAsForm = result.body.data as EditableNameValuePair[]
                    bodyIsValid = bodyAsForm.length > 0
                    if (bodyIsValid) {
                        result.body = {
                            type: WorkbookBodyType.Form,
                            data: bodyAsForm.map(pair => ({
                                name: pair.name,
                                value: pair.value,
                                disabled: pair.disabled
                            }))
                        }
                    }
                    break
                case WorkbookBodyType.JSON:
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
        return ! /^(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(this.url)
    }

    @computed get invalid() {
        return this.nameInvalid
            || this.urlInvalid
    }
}

export class EditableWorkbookRequestGroup extends Editable<WorkbookRequestGroup> {
    public readonly entityType = EditableEntityType.Group

    @observable public accessor execution = WorkbookGroupExecution.Sequential

    @observable accessor runs = 0
    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined

    static fromWorkspace(entry: WorkbookRequestGroup): EditableWorkbookRequestGroup {
        const result = new EditableWorkbookRequestGroup()
        result.id = entry.id
        result.name = entry.name ?? ''

        result.execution = entry.execution

        result.runs = entry.runs
        result.selectedScenario = entry.selectedScenario ?? undefined
        result.selectedAuthorization = entry.selectedAuthorization ?? undefined
        result.selectedCertificate = entry.selectedCertificate ?? undefined
        result.selectedProxy = entry.selectedProxy ?? undefined

        return result
    }

    toWorkspace(): WorkbookRequestGroup {
        return {
            id: this.id,
            name: this.name,
            runs: this.runs,
            execution: this.execution,
            selectedScenario: this.selectedScenario ?? undefined,
            selectedAuthorization: this.selectedAuthorization ?? undefined,
            selectedCertificate: this.selectedCertificate ?? undefined,
            selectedProxy: this.selectedProxy ?? undefined,
        } as WorkbookRequestGroup
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get invalid() {
        return this.nameInvalid
    }
}
