import {
    ApiKeyAuthorization, Authorization, AuthorizationType,
    BasicAuthorization, OAuth2ClientAuthorization, Selection,
    OAuth2PkceAuthorization} from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable } from "mobx"
import { NO_SELECTION } from "../store"
import { EditableEntityType } from "./editable-entity-type"
import { WorkspaceStore } from "../../contexts/workspace.context"

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
    @observable accessor audience = ''
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined
    // PKCE values (must be set in the client)
    @observable accessor accessToken: string | undefined = undefined
    @observable accessor refreshToken: string | undefined = undefined
    @observable accessor expiration: number | undefined = undefined
    @observable accessor sendCredentialsInBody: boolean = false

    public constructor(authorization: Authorization, workspace: WorkspaceStore) {
        super(workspace)
        this.id = authorization.id
        this.name = authorization.name ?? ''
        this.type = authorization.type

        switch (authorization.type) {
            case AuthorizationType.ApiKey:
                this.header = authorization.header
                this.value = authorization.value
                break
            case AuthorizationType.Basic:
                this.username = authorization.username
                this.password = authorization.password
                break
            case AuthorizationType.OAuth2Client:
                this.accessTokenUrl = authorization.accessTokenUrl
                this.clientId = authorization.clientId
                this.clientSecret = authorization.clientSecret
                this.sendCredentialsInBody = authorization.sendCredentialsInBody === true
                this.scope = authorization.scope
                this.audience = authorization.audience
                this.selectedCertificate = authorization.selectedCertificate ?? NO_SELECTION
                this.selectedProxy = authorization.selectedProxy ?? NO_SELECTION
                break
            case AuthorizationType.OAuth2Pkce:
                this.authorizeUrl = authorization.authorizeUrl
                this.accessTokenUrl = authorization.accessTokenUrl
                this.clientId = authorization.clientId
                this.sendCredentialsInBody = authorization.sendCredentialsInBody === true
                this.scope = authorization.scope
                this.audience = authorization.audience
                break
            default:
                throw new Error('Invalid authorization type')
        }

        return this
    }


    static fromWorkspace(entry: Authorization, workspace: WorkspaceStore): EditableAuthorization {
        return new EditableAuthorization(entry, workspace)
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
                    sendCredentialsInBody: this.sendCredentialsInBody,
                    scope: this.scope,
                    audience: this.audience,
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
                    sendCredentialsInBody: this.sendCredentialsInBody,
                    scope: this.scope,
                    audience: this.audience,
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

    @action
    setType(value: AuthorizationType) {
        this.type = value
        this.markAsDirty()
    }

    @action
    setUsername(value: string) {
        this.username = value
        this.markAsDirty()
    }

    @action
    setPassword(value: string) {
        this.password = value
        this.markAsDirty()
    }

    @action
    setAccessTokenUrl(value: string) {
        this.accessTokenUrl = value
        this.markAsDirty()
    }

    @action
    setUrl(value: string) {
        this.authorizeUrl = value
        this.markAsDirty()
    }

    @action
    setClientId(value: string) {
        this.clientId = value
        this.markAsDirty()
    }

    @action
    setClientSecret(value: string) {
        this.clientSecret = value
        this.markAsDirty()
    }

    @action
    setCredentialsInBody(value: boolean) {
        this.sendCredentialsInBody = value
        this.markAsDirty()
    }

    @action
    setScope(value: string) {
        this.scope = value
        this.markAsDirty()
    }

    @action
    setAudience(value: string) {
        this.audience = value
        this.markAsDirty()
    }

    @action
    setSelectedCertificate(selection: Selection | undefined) {
        this.selectedCertificate = selection
        this.markAsDirty()
    }

    @action
    setSelectedProxy(selection: Selection | undefined) {
        this.selectedProxy = selection
        this.markAsDirty()
    }

    @action
    setHeader(value: string) {
        this.header = value
        this.markAsDirty()
    }

    @action
    setValue(value: string) {
        this.value = value
        this.markAsDirty()
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
