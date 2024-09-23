import { IndexedEntities } from "@apicize/lib-typescript/src/models/indexed-entities";
import { EditableWorkbookAuthorization } from "./editable-workbook-authorization";
import { EditableWorkbookProxy } from "./editable-workbook-proxy";
import { EditableWorkbookScenario } from "./editable-workbook-scenario";
import { EditableWorkbookCertificate } from "./editable-workbook-certificate";
import { IndexedNestedRequests, Selection } from "@apicize/lib-typescript";
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from "./editable-workbook-request";

export interface EditableWorkspace {
    requests: IndexedNestedRequests<EditableWorkbookRequest | EditableWorkbookRequestGroup>,
    scenarios: IndexedEntities<EditableWorkbookScenario>,
    authorizations: IndexedEntities<EditableWorkbookAuthorization>,
    certificates: IndexedEntities<EditableWorkbookCertificate>,
    proxies: IndexedEntities<EditableWorkbookProxy>,
    selectedScenario: Selection,
    selectedAuthorization: Selection,
    selectedCertificate: Selection,
    selectedProxy: Selection,
}