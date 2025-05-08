import { Selection } from "@apicize/lib-typescript";
export interface WorkspaceParameters {
    scenarios: Selection[],
    authorizations: Selection[],
    certificates: Selection[],
    proxies: Selection[],
    data: Selection[],
}