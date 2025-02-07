import { IndexedEntityManager, Workspace } from "@apicize/lib-typescript";
import { EditableAuthorization } from "../models/workspace/editable-authorization";
import { EditableScenario } from "../models/workspace/editable-scenario";
import { Editable } from "../models/editable";
import { EditableRequest, EditableRequestGroup } from "../models/workspace/editable-request";
import { EditableNameValuePair } from "../models/workspace/editable-name-value-pair";
import { EditableProxy } from "../models/workspace/editable-proxy";
import { EditableCertificate } from "../models/workspace/editable-certificate";
import { toJS } from "mobx";
import { EditableDefaults } from "../models/workspace/editable-defaults";
import { GenerateIdentifier } from "./random-identifier-generator";

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


// /**
//  * Strip editable artifacts from indexed entries and re-typecast response
//  * @param item 
//  * @returns 
//  */
// function editableIndexToStoredWorkspace<S extends Identifiable>(
//     index: IndexedEntities<Editable<S>>): IndexedEntities<S> {
//     const entities = new Map<string, S>()
//     for (const [id, entity] of index.entities) {
//         entities.set(id, entity.toWorkspace())
//     }

//     return {
//         topLevelIds: toJS(index.topLevelIds),
//         entities
//     }
// }
// /**
//  * Translate the workspace returned by Rust library into an editable workspace,
//  * making sure child properties have unique identifiers and translating
//  * body data so we can edit it
//  * @param workspace 
//  * @returns 
//  */
// export function storedWorkspaceToEditableWorkspace(
//     requests: IndexedEntityManager<RequestEntry>,
//     scenarios: IndexedEntityManager<Scenario>,
//     authorizations: IndexedEntityManager<Authorization>,
//     certificates: IndexedEntityManager<Certificate>,
//     proxies: IndexedEntityManager<Proxy>,
//     warnings: string[] | undefined
// ): EditableWorkspace {
//     const result = {
//         requests: new IndexedEntityManager(
//             requests.topLevelIds,
//             new Map(Object.values(requests.entities)
//                 .map(e => [e.id, e['url'] === undefined
//                     ? EditableRequestGroup.fromWorkspace(e)
//                     : EditableRequest.fromWorkspace(e)
//                 ])),
//             requests.childIds ? new Map(Object.entries(requests.childIds)) : undefined
//         }),
//         scenarios: new IndexedEntityManager({
//             childIds: scenarios.childIds,
//             topLevelIds: scenarios.topLevelIds,
//             entities: new Map([...scenarios.values].map(e => {
//                 return [e.id, EditableScenario.fromWorkspace(e)]
//             }))
//         }),
//         authorizations: new IndexedEntityManager({
//             childIds: authorizations.childIds,
//             topLevelIds: authorizations.topLevelIds,
//             entities: new Map([...authorizations.values].map(e => {
//                 return [e.id, EditableAuthorization.fromWorkspace(e)]
//             }))
//         }),
//         certificates: new IndexedEntityManager({
//             childIds: certificates.childIds,
//             topLevelIds: certificates.topLevelIds,
//             entities: new Map([...certificates.values].map(e => {
//                 return [e.id, EditableCertificate.fromWorkspace(e)]
//             }))
//         }),
//         proxies: new IndexedEntityManager({
//             childIds: proxies.childIds,
//             topLevelIds: proxies.topLevelIds,
//             entities: new Map([...proxies.values].map(e => {
//                 return [e.id, EditableProxy.fromWorkspace(e)]
//             }))
//         }),
//         defaults: EditableDefaults.fromWorkspace(workspace),
//     }

//     if (warnings && (warnings.length > 0)) {
//         result.defaults.warnings = new Map(workspace.warnings.map(w => [GenerateIdentifier(), w]))
//     }

//     return result
// }

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
 * @param defaults 
 * @returns 
 */
export function editableWorkspaceToStoredWorkspace(
    requests: IndexedEntityManager<EditableRequest | EditableRequestGroup>,
    scenarios: IndexedEntityManager<EditableScenario>,
    authorizations: IndexedEntityManager<EditableAuthorization>,
    certificates: IndexedEntityManager<EditableCertificate>,
    proxies: IndexedEntityManager<EditableProxy>,
    defaults: EditableDefaults,
): Workspace {
    const result = {
        version: 1.0,
        requests: {
            topLevelIds: requests.topLevelIds,
            entities: Object.fromEntries(requests.values.map(r => [r.id, r.toWorkspace()])),
            childIds: Object.fromEntries(requests.childIds)
        },
        scenarios: {
            topLevelIds: scenarios.topLevelIds,
            entities: Object.fromEntries(scenarios.values.map(r => [r.id, r.toWorkspace()])),
            childIds: Object.fromEntries(scenarios.childIds)
        },
        authorizations: {
            topLevelIds: authorizations.topLevelIds,
            entities: Object.fromEntries(authorizations.values.map(r => [r.id, r.toWorkspace()])),
            childIds: Object.fromEntries(authorizations.childIds)
        },
        certificates: {
            topLevelIds: certificates.topLevelIds,
            entities: Object.fromEntries(certificates.values.map(r => [r.id, r.toWorkspace()])),
            childIds: Object.fromEntries(certificates.childIds)
        },
        proxies: {
            topLevelIds: proxies.topLevelIds,
            entities: Object.fromEntries(proxies.values.map(r => [r.id, r.toWorkspace()])),
            childIds: Object.fromEntries(proxies.childIds)
        },
        defaults: defaults.toWorkspace(),
    }
    return result
}
