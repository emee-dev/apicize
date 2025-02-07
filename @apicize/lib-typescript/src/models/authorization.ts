import { Identifiable } from "./identifiable"
import { Named } from "./named"
import { Selection } from "./selection"

/**
 * Specifies the type of authorization used for a request
 */
export enum AuthorizationType { None = 'none', Basic = 'Basic', OAuth2Client = 'OAuth2Client', OAuth2Pkce = 'OAuth2Pkce', ApiKey = 'ApiKey' };

/**
 * Specifies how to persist sensitive information
 */

export type Authorization = BasicAuthorization | OAuth2ClientAuthorization
    | OAuth2PkceAuthorization | ApiKeyAuthorization

export interface BaseAuthorization extends Identifiable, Named {
    type: AuthorizationType
}

/**
 * Information required for basic authentication
 */
export interface BasicAuthorization extends BaseAuthorization {
    type: AuthorizationType.Basic
    username: string
    password: string
}

/**
 * Information required for OAuth2 client flow authentication
 */
export interface OAuth2ClientAuthorization extends BaseAuthorization {
    type: AuthorizationType.OAuth2Client
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
export interface OAuth2PkceAuthorization extends BaseAuthorization {
    type: AuthorizationType.OAuth2Pkce
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
export interface ApiKeyAuthorization extends BaseAuthorization {
    type: AuthorizationType.ApiKey
    header: string
    value: string
}