import { StoredGlobalSettings, Workspace, Identifiable, Selection, WorkbookAuthorization, WorkbookCertificate, WorkbookScenario, WorkbookProxy, IndexedNestedRequests, WorkbookRequest, WorkbookRequestEntry } from "@apicize/lib-typescript";
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization";
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario";
import { IndexedEntities } from '@apicize/lib-typescript/src/models/indexed-entities'
import { Editable } from "../models/editable";
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from "../models/workbook/editable-workbook-request";
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair";
import { EditableWorkspace } from "../models/workbook/editable-workspace";
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy";
import { DEFAULT_SELECTION, NO_SELECTION } from "../models/store";
import { EditableWorkbookCertificate } from "../models/workbook/editable-workbook-certificate";
import { toJS } from "mobx";

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

export function base64Encode(bytes: Uint8Array): string {
    let i,
        len = bytes.length,
        base64 = '';

    for (i = 0; i < len; i += 3) {
        base64 += chars[bytes[i] >> 2];
        base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
        base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
        base64 += chars[bytes[i + 2] & 63];
    }

    if (len % 3 === 2) {
        base64 = base64.substring(0, base64.length - 1) + '=';
    } else if (len % 3 === 1) {
        base64 = base64.substring(0, base64.length - 2) + '==';
    }

    return base64;
}

export function base64Decode(base64: string): Uint8Array {
    let bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;

    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    const bytes = new Uint8Array(bufferLength);

    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return bytes;
}


/**
 * Strip editable artifacts from indexed entries and re-typecast response
 * @param item 
 * @returns 
 */
function editableIndexToStoredWorkspace<S extends Identifiable>(
    index: IndexedEntities<Editable<S>>
): IndexedEntities<S> {
    const entities = new Map<string, S>()
    for (const [id, entity] of index.entities) {
        entities.set(id, entity.toWorkspace())
    }

    return {
        topLevelIds: toJS(index.topLevelIds),
        entities
    }
}

/**
 * Generate an empty editable workspace
 * @returns empty workspace
 */
export function newEditableWorkspace(): EditableWorkspace {
    return {
        requests: { entities: new Map(), topLevelIds: [] },
        scenarios: { entities: new Map(), topLevelIds: [] },
        authorizations: { entities: new Map(), topLevelIds: [] },
        certificates: { entities: new Map(), topLevelIds: [] },
        proxies: { entities: new Map(), topLevelIds: [] },
        selectedScenario: NO_SELECTION,
        selectedAuthorization: NO_SELECTION,
        selectedCertificate: NO_SELECTION,
        selectedProxy: NO_SELECTION,
    }
}

/**
 * Translate the workspace returned by Rust library into an editable workspace,
 * making sure child properties have unique identifiers and translating
 * body data so we can edit it
 * @param workspace 
 * @returns 
 */
export function storedWorkspaceToEditableWorkspace(workspace: Workspace): EditableWorkspace {
    return {
        requests: {
            topLevelIds: workspace.requests.topLevelIds,
            entities: new Map(Object.values(workspace.requests.entities)
                .map(e => [e.id, e['url'] === undefined
                    ? EditableWorkbookRequestGroup.fromWorkspace(e)
                    : EditableWorkbookRequest.fromWorkspace(e)
                ])),
            childIds: workspace.requests.childIds ? new Map(Object.entries(workspace.requests.childIds)) : undefined
        },
        scenarios: {
            topLevelIds: workspace.scenarios.topLevelIds,
            entities: new Map(
                Object.values(workspace.scenarios.entities).map(e => ([e.id, EditableWorkbookScenario.fromWorkspace(e)]))
            )
        },
        authorizations: {
            topLevelIds: workspace.authorizations.topLevelIds,
            entities: new Map(
                Object.values(workspace.authorizations.entities).map(e => ([e.id, EditableWorkbookAuthorization.fromWorkspace(e)]))
            )
        },
        certificates: {
            topLevelIds: workspace.certificates.topLevelIds,
            entities: new Map(
                Object.values(workspace.certificates.entities).map(e => ([e.id, EditableWorkbookCertificate.fromWorkspace(e)]))
            )
        },
        proxies: {
            topLevelIds: workspace.proxies.topLevelIds,
            entities: new Map(
                Object.values(workspace.proxies.entities).map(e => ([e.id, EditableWorkbookProxy.fromWorkspace(e)]))
            )
        },
        // not supporting top-level selection defaults at this time
        selectedScenario: NO_SELECTION,
        selectedAuthorization: NO_SELECTION,
        selectedCertificate: NO_SELECTION,
        selectedProxy: NO_SELECTION,
    }

}

export function editableToNameValuePair(pair: EditableNameValuePair) {
    return {
        name: pair.name,
        value: pair.value,
        disabled: pair.disabled
    }
}

/**
 * Translate the editable workspace we use in React to something we can pass to Rust library
 * @param requests 
 * @param scenarios 
 * @param authorizations 
 * @param certificates 
 * @param proxies 
 * @param selectedScenario 
 * @param selectedAuthorization 
 * @param selectedCertificate 
 * @param selectedProxy 
 * @returns 
 */
export function editableWorkspaceToStoredWorkspace(
    requests: IndexedNestedRequests<EditableWorkbookRequest | EditableWorkbookRequestGroup>,
    scenarios: IndexedEntities<EditableWorkbookScenario>,
    authorizations: IndexedEntities<EditableWorkbookAuthorization>,
    certificates: IndexedEntities<EditableWorkbookCertificate>,
    proxies: IndexedEntities<EditableWorkbookProxy>,
    selectedScenario: Selection,
    selectedAuthorization: Selection,
    selectedCertificate: Selection,
    selectedProxy: Selection,
): Workspace {
    const requestEntities = new Map<string, WorkbookRequestEntry>()
    for (const [id, request] of requests.entities) {
        requestEntities.set(id, request.toWorkspace())
    }
    const result = {
        version: 1.0,
        requests: {
            topLevelIds: toJS(requests.topLevelIds),
            entities: requestEntities,
            childIds: toJS(requests.childIds)
        },
        scenarios: editableIndexToStoredWorkspace<WorkbookScenario>(scenarios),
        authorizations: editableIndexToStoredWorkspace<WorkbookAuthorization>(authorizations),
        certificates: editableIndexToStoredWorkspace<WorkbookCertificate>(certificates),
        proxies: editableIndexToStoredWorkspace<WorkbookProxy>(proxies),
        selectedScenario: (selectedScenario === DEFAULT_SELECTION) ? undefined : selectedScenario,
        selectedAuthorization: (selectedAuthorization === DEFAULT_SELECTION) ? undefined : selectedAuthorization,
        selectedCertificate: (selectedCertificate === DEFAULT_SELECTION) ? undefined : selectedCertificate,
        selectedProxy: (selectedProxy === DEFAULT_SELECTION) ? undefined : selectedProxy,
    }
    return result
}

export function stateToGlobalSettingsStorage(
    workbookDirectory: string,
    lastWorkbookFileName: string | undefined,
): StoredGlobalSettings {
    return {
        workbookDirectory,
        lastWorkbookFileName,
    }
}
