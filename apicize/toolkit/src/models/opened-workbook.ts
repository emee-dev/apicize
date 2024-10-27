import { EditableWorkbookAuthorization } from "./workbook/editable-workbook-authorization";
import { EditableWorkbookScenario } from "./workbook/editable-workbook-scenario";
import { IndexedEntities } from "@apicize/lib-typescript/src/models/indexed-entities";
import { EditableWorkbookRequest } from "./workbook/editable-workbook-request";

export interface OpenedWorkbook {
    displayName: string,
    fullName: string,
    requests: IndexedEntities<EditableWorkbookRequest>,
    authorizations: IndexedEntities<EditableWorkbookAuthorization>,
    scenarios: IndexedEntities<EditableWorkbookScenario>
}