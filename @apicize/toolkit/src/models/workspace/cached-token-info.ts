export interface CachedTokenInfo {
    /**
     * Access token
     */
    accessToken: string
    /**
     * Number of seconds to expire
     */
    expiration: number | undefined
    /**
     * Optional refresh token
     */
    refreshToken?: string
}