/**
 * Used to represent headers, query string parameters, etc.
 */
export interface NameValuePair {
    name: string
    value: string
    disabled?: boolean
}
