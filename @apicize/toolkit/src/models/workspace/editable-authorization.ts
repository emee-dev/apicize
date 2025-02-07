import {
    ApiKeyAuthorization, Authorization, AuthorizationType,
    BasicAuthorization, OAuth2ClientAuthorization, Selection,
    OAuth2PkceAuthorization
} from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { computed, observable } from "mobx"
import { NO_SELECTION } from "../store"
import { EditableEntityType } from "./editable-entity-type"

export class EditableAuthorization extends Editable<Authorization> {
    public readonly entityType = EditableEntityType.Authorization
    @observable accessor type: AuthorizationType = AuthorizationType.Basic
    // API Key
    @observable accessor header: string = ''
    @observable accessor value: string = ''
    // Basic
    @observable accessor username: string = ''
    @observable accessor password: string = ''
    // OAuth2 Client
    @observable accessor accessTokenUrl = ''
    @observable accessor authorizeUrl = ''
    @observable accessor clientId = ''
    @observable accessor clientSecret = ''
    @observable accessor scope = ''
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined
    // PKCE values (must be set in the client)
    @observable accessor accessToken: string | undefined = undefined
    @observable accessor refreshToken: string | undefined = undefined
    @observable accessor expiration: number | undefined = undefined

    static fromWorkspace(entry: Authorization): EditableAuthorization {
        let result = new EditableAuthorization()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.type = entry.type

        switch (entry.type) {
            case AuthorizationType.ApiKey:
                result.header = entry.header
                result.value = entry.value
                break
            case AuthorizationType.Basic:
                result.username = entry.username
                result.password = entry.password
                break
            case AuthorizationType.OAuth2Client:
                result.accessTokenUrl = entry.accessTokenUrl
                result.clientId = entry.clientId
                result.clientSecret = entry.clientSecret
                result.scope = entry.scope
                result.selectedCertificate = entry.selectedCertificate ?? NO_SELECTION
                result.selectedProxy = entry.selectedProxy ?? NO_SELECTION
                break
            case AuthorizationType.OAuth2Pkce:
                result.authorizeUrl = entry.authorizeUrl
                result.accessTokenUrl = entry.accessTokenUrl
                result.clientId = entry.clientId
                result.scope = entry.scope
                break
            default:
                throw new Error('Invalid authorization type')
        }

        return result
    }

    toWorkspace(): Authorization {
        let result: Authorization
        switch (this.type) {
            case AuthorizationType.ApiKey:
                result = {
                    type: AuthorizationType.ApiKey,
                    header: this.header,
                    value: this.value
                } as ApiKeyAuthorization
                break
            case AuthorizationType.Basic:
                result = {
                    type: AuthorizationType.Basic,
                    username: this.username,
                    password: this.password
                } as BasicAuthorization
                break
            case AuthorizationType.OAuth2Client:
                result = {
                    type: AuthorizationType.OAuth2Client,
                    accessTokenUrl: this.accessTokenUrl,
                    clientId: this.clientId,
                    clientSecret: this.clientSecret,
                    scope: this.scope,
                    selectedCertificate: this.selectedCertificate ?? NO_SELECTION,
                    selectedProxy: this.selectedProxy ?? NO_SELECTION
                } as OAuth2ClientAuthorization
                break
            case AuthorizationType.OAuth2Pkce:
                result = {
                    type: AuthorizationType.OAuth2Pkce,
                    authorizeUrl: this.authorizeUrl,
                    accessTokenUrl: this.accessTokenUrl,
                    clientId: this.clientId,
                    scope: this.scope,
                    token: this.accessToken,
                    refreshToken: this.refreshToken,
                    expiration: this.expiration,
                } as OAuth2PkceAuthorization
                break
            default:
                throw new Error('Invalid authorization type')
        }

        result.id = this.id
        result.name = this.name ?? ''
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
        return ! /^(\{\{.+\}\}|https?:\/\/)(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?$/.test(this.accessTokenUrl)
    }

    @computed get authorizationUrlInvalid() {
        return ! /^(\{\{.+\}\}|https?:\/\/)(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?$/.test(this.authorizeUrl)
    }

    @computed get clientIdInvalid() {
        return ((this.clientId?.length ?? 0) === 0)
    }

    @computed get state() {
        let problem: boolean
        switch (this.type) {
            case AuthorizationType.ApiKey:
                problem = this.nameInvalid
                    || this.headerInvalid
                    || this.valueInvalid
            case AuthorizationType.Basic:
                problem = this.nameInvalid
                    || this.usernameInvalid
            case AuthorizationType.OAuth2Client:
                problem = this.nameInvalid
                    || this.accessTokenUrlInvalid
                    || this.clientIdInvalid
            case AuthorizationType.OAuth2Pkce:
                problem = this.nameInvalid
                    || this.authorizationUrlInvalid
                    || this.accessTokenUrlInvalid
                    || this.clientIdInvalid
            default:
                problem = false
        }
        return problem
            ? EditableState.Warning
            : EditableState.None
    }
}
