import { Identifiable } from "../identifiable"
import { Named } from "../named"
import { Persisted } from "../persistence"
import { Selection } from "../selection"

/**
 * Specifies the type of authorization used for a request
 */
export enum WorkbookAuthorizationType { None = 'none', Basic = 'Basic', OAuth2Client = 'OAuth2Client', OAuth2Pkce = 'OAuth2Pkce', ApiKey = 'ApiKey' };

/**
 * Specifies how to persist sensitive information
 */

export type WorkbookAuthorization = WorkbookBasicAuthorization | WorkbookOAuth2ClientAuthorization
    | WorkbookOAuth2PkceAuthorization | WorkbookApiKeyAuthorization

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
 * Information required for OAuth2 client flow authentication
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
 * Information required for OAuth2 PKCE flow authentication
 */
export interface WorkbookOAuth2PkceAuthorization extends WorkbookBaseAuthorization {
    type: WorkbookAuthorizationType.OAuth2Pkce
    authorizeUrl: string
    accessTokenUrl: string
    refreshTokenurl?: string
    clientId: string
    scope: string
    token?: string
    refreshToken?: string
    expiration?: number
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