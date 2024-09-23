import {
    Persistence, WorkbookApiKeyAuthorization, WorkbookAuthorization, WorkbookAuthorizationType,
    WorkbookBasicAuthorization, WorkbookOAuth2ClientAuthorization, Selection
} from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { computed, observable } from "mobx"
import { NO_SELECTION } from "../store"
import { EditableEntityType } from "./editable-entity-type"

export class EditableWorkbookAuthorization extends Editable<WorkbookAuthorization> {
    public readonly entityType = EditableEntityType.Authorization
    @observable accessor type: WorkbookAuthorizationType = WorkbookAuthorizationType.Basic
    @observable accessor persistence = Persistence.Private
    // API Key
    @observable accessor header: string = ''
    @observable accessor value: string = ''
    // Basic
    @observable accessor username: string = ''
    @observable accessor password: string = ''
    // OAuth2 Client
    @observable accessor accessTokenUrl = ''
    @observable accessor clientId = ''
    @observable accessor clientSecret = ''
    @observable accessor scope = ''
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined

    static fromWorkspace(entry: WorkbookAuthorization): EditableWorkbookAuthorization {
        let result = new EditableWorkbookAuthorization()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.persistence = entry.persistence ?? Persistence.Private
        result.type = entry.type

        switch (entry.type) {
            case WorkbookAuthorizationType.ApiKey:
                result.header = entry.header
                result.value = entry.value
                break
            case WorkbookAuthorizationType.Basic:
                result.username = entry.username
                result.password = entry.password
                break
            case WorkbookAuthorizationType.OAuth2Client:
                result.accessTokenUrl = entry.accessTokenUrl
                result.clientId = entry.clientId
                result.clientSecret = entry.clientSecret
                result.scope = entry.scope
                result.selectedCertificate = entry.selectedCertificate ?? NO_SELECTION
                result.selectedProxy = entry.selectedProxy ?? NO_SELECTION
                break
            default:
                throw new Error('Invalid authorization type')
        }

        return result
    }

    toWorkspace(): WorkbookAuthorization {
        let result: WorkbookAuthorization
        switch (this.type) {
            case WorkbookAuthorizationType.ApiKey:
                result = {
                    type: WorkbookAuthorizationType.ApiKey,
                    header: this.header,
                    value: this.value
                } as WorkbookApiKeyAuthorization
                break
            case WorkbookAuthorizationType.Basic:
                result = {
                    type: WorkbookAuthorizationType.Basic,
                    username: this.username,
                    password: this.password
                } as WorkbookBasicAuthorization
                break
            case WorkbookAuthorizationType.OAuth2Client:
                result = {
                    type: WorkbookAuthorizationType.OAuth2Client,
                    accessTokenUrl: this.accessTokenUrl,
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    scope: this.scope,
                    selectedCertificate: this.selectedCertificate ?? NO_SELECTION,
                    selectedProxy: this.selectedProxy ?? NO_SELECTION
                } as WorkbookOAuth2ClientAuthorization
                break
            default:
                throw new Error('Invalid authorization type')
        }

        result.id = this.id
        result.name = this.name ?? ''
        result.persistence = this.persistence ?? Persistence.Private
        return result
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get headerInvalid() {
        return ((this.header?.length ?? 0) === 0)
    }

    @computed get valueInvalid() {
        return ((this.value?.length ?? 0) === 0)
    }

    @computed get usernameInvalid() {
        return ((this.username?.length ?? 0) === 0)
    }

    @computed get accessTokenUrlInvalid() {
        return ! /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(this.accessTokenUrl)
    }

    @computed get clientIdInvalid() {
        return ((this.clientId?.length ?? 0) === 0)
    }
    @computed get invalid() {
        switch (this.type) {
            case WorkbookAuthorizationType.ApiKey:
                return this.nameInvalid
                    || this.headerInvalid
                    || this.valueInvalid
            case WorkbookAuthorizationType.Basic:
                return this.nameInvalid
                    || this.usernameInvalid
            case WorkbookAuthorizationType.OAuth2Client:
                return this.nameInvalid
                    || this.accessTokenUrlInvalid
                    || this.clientIdInvalid
            default:
                return false
        }
    }
}
