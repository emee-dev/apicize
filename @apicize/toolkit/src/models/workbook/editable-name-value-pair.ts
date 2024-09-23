import { WorkbookNameValuePair } from "@apicize/lib-typescript";

/**
 * Used for editing headers, query string parameters, etc.
 */
export interface EditableNameValuePair extends WorkbookNameValuePair {
    id: string;
    isNew?: boolean;
}