import { Identifiable } from "../identifiable"
import { Named } from "../named"
import { Persisted } from "../persistence"
import { Selection } from "../selection"

/**
 * Specifies the type of authorization used for a request
 */
export enum WorkbookAuthorizationType { None = 'none', Basic = 'Basic', OAuth2Client = 'OAuth2Client', ApiKey = 'ApiKey'};

/**
 * Specifies how to persist sensitive information
 */

export type WorkbookAuthorization = WorkbookBasicAuthorization | WorkbookOAuth2ClientAuthorization | WorkbookApiKeyAuthorization

export interface WorkbookBaseAuthorization extends Identifiable, Named, Persisted {
    type: WorkbookAuthorizationType
}

/**
 * Information required for basic authentication
 */
export interface WorkbookBasicAuthorization extends WorkbookBaseAuthorization {
    type: WorkbookAuthorizationType.Basic
    username: string
    password: string
}

/**
 * Information required for basic authentication
 */
export interface WorkbookOAuth2ClientAuthorization extends WorkbookBaseAuthorization {
    type: WorkbookAuthorizationType.OAuth2Client
    accessTokenUrl: string
    clientId: string
    clientSecret: string
    scope: string
    selectedCertificate?: Selection
    selectedProxy?: Selection
    // sendCredentialsInBody: boolean
}

/**
 * Information required for API key authentication (passed in via header)
 */
export interface WorkbookApiKeyAuthorization extends WorkbookBaseAuthorization {
    type: WorkbookAuthorizationType.ApiKey
    header: string
    value: string
}