import { action, computed, makeObservable, observable, toJS } from "mobx"
import { DEFAULT_SELECTION, DEFAULT_SELECTION_ID, NO_SELECTION, NO_SELECTION_ID } from "../models/store"
import { Execution, ExecutionMenuItem, ExecutionResult, executionResultFromRequest, executionResultFromExecution, executionResultFromSummary, ExecutionResultSummary } from "../models/workspace/execution"
import { base64Decode, base64Encode, editableWorkspaceToStoredWorkspace } from "../services/apicize-serializer"
import { EditableRequest, EditableRequestGroup } from "../models/workspace/editable-request"
import { EditableScenario, EditableVariable } from "../models/workspace/editable-scenario"
import { EditableAuthorization } from "../models/workspace/editable-authorization"
import { EditableCertificate } from "../models/workspace/editable-certificate"
import { EditableProxy } from "../models/workspace/editable-proxy"
import {
    Identifiable, Named, GetTitle, GroupExecution, BodyType, Method, AuthorizationType,
    CertificateType, Workspace,
    Body, Selection,
    Persistence,
    Request,
    RequestGroup,
    ApicizeGroup,
    ApicizeGroupItem,
    ApicizeRequest,
    ApicizeResult,
    ApicizeRowSummary,
    ExternalDataSourceType,
    RequestEntry,
} from "@apicize/lib-typescript"
import { EntitySelection } from "../models/workspace/entity-selection"
import { EditableNameValuePair } from "../models/workspace/editable-name-value-pair"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { EditableEntityType } from "../models/workspace/editable-entity-type"
import { EditableItem, EditableState } from "../models/editable"
import { createContext, useContext } from "react"
import { EditableDefaults } from "../models/workspace/editable-defaults"
import { EditableWarnings } from "../models/workspace/editable-warnings"
import { FeedbackStore } from "./feedback.context"
import { EditableExternalData } from "../models/workspace/editable-external-data"
import { IndexedEntityManager } from "../models/indexed-entity-manager"
import { js_beautify } from 'js-beautify'

export enum WorkspaceMode {
    Normal,
    Help,
    Settings,
    Defaults,
    Console,
}

export class WorkspaceStore {
    /**
     * Workspace representing all requests, scenarios, authorizations, certificates and proxies
     */
    @observable accessor requests = new IndexedEntityManager<EditableRequest | EditableRequestGroup>(new Map(), [], new Map())
    @observable accessor scenarios = new IndexedEntityManager<EditableScenario>(new Map(), [], new Map())
    @observable accessor authorizations = new IndexedEntityManager<EditableAuthorization>(new Map(), [], new Map())
    @observable accessor certificates = new IndexedEntityManager<EditableCertificate>(new Map(), [], new Map())
    @observable accessor proxies = new IndexedEntityManager<EditableProxy>(new Map(), [], new Map())
    @observable accessor defaults = new EditableDefaults()
    @observable accessor warnings = new EditableWarnings()

    /**
     * Help context
     */
    @observable accessor mode = WorkspaceMode.Normal;
    @observable accessor helpTopic: string | null = null
    private helpTopicHistory: string[] = []
    public nextHelpTopic: string | null = null

    /**
     * Apicize executions underway or completed (keyed by request ID)
     */
    @observable accessor executions = new Map<string, Execution>()

    @observable accessor active: EditableItem | null = null
    @observable accessor activeId: string | null = null

    @observable accessor appName = 'Apicize'
    @observable accessor appVersion = ''
    @observable accessor workbookFullName = ''
    @observable accessor workbookDisplayName = '(New)'
    @observable accessor dirty: boolean = false
    @observable accessor warnOnWorkspaceCreds: boolean = true
    @observable accessor invalidItems = new Set<string>()

    @observable accessor executingRequestIDs: string[] = []

    @observable accessor expandedItems = ['hdr-r']

    pendingPkceRequests = new Map<string, Map<string, boolean>>()

    constructor(
        private readonly feedback: FeedbackStore,
        private readonly callbacks: {
            onExecuteRequest: (workspace: Workspace, requestId: string, allowedParentPath: string, singleRun: boolean) => Promise<ApicizeResult>,
            onCancelRequest: (requestId: string) => Promise<void>,
            onClearToken: (authorizationId: string) => Promise<void>,
            onInitializePkce: (data: { authorizationId: string }) => Promise<void>,
            onClosePkce: (data: { authorizationId: string }) => Promise<void>,
            onRefreshToken: (data: { authorizationId: string }) => Promise<void>,
        }) {
        makeObservable(this)
    }

    anyInvalid() {
        for (const entities of [
            this.requests.values,
            this.scenarios.values,
            this.authorizations.values,
            this.certificates.values,
            this.proxies.values,
        ]) {
            for (const entity of entities) {
                if (entity.state === EditableState.Warning) { console.log('invalid', { type: entity.entityType, id: entity.id }); return true; }
            }
        }
        return false
    }

    @action
    changeApp(name: string, version: string) {
        this.appName = name
        this.appVersion = version
    }

    @action
    newWorkspace(newWorkspace: Workspace) {
        this.workbookFullName = ''
        this.workbookDisplayName = ''
        this.dirty = false
        this.warnOnWorkspaceCreds = true
        this.requests.reset()

        this.scenarios = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.scenarios.entities).map((e) =>
                [e.id, EditableScenario.fromWorkspace(e)]
            )),
            newWorkspace.scenarios.topLevelIds,
            new Map(Object.entries(newWorkspace.scenarios.childIds)),
        )

        this.authorizations = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.authorizations.entities).map((e) =>
                [e.id, EditableAuthorization.fromWorkspace(e)]
            )),
            newWorkspace.authorizations.topLevelIds,
            new Map(Object.entries(newWorkspace.authorizations.childIds)),
        )

        this.certificates = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.certificates.entities).map((e) =>
                [e.id, EditableCertificate.fromWorkspace(e)]
            )),
            newWorkspace.certificates.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.certificates.childIds)),
        )

        this.proxies = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.proxies.entities).map((e) =>
                [e.id, EditableProxy.fromWorkspace(e)]
            )),
            newWorkspace.proxies.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.proxies.childIds)),
        )

        this.warnings.set(newWorkspace.warnings)
        this.defaults = new EditableDefaults()
        this.defaults.data = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.data.entities).map((e) =>
                [e.id, EditableExternalData.fromWorkspace(e)]
            )),
            newWorkspace.data.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.data.childIds)),
        )

        this.expandedItems = ['hdr-r']
        this.executions.clear()
        this.invalidItems.clear()
        this.active = null
        this.pendingPkceRequests.clear()

        // Create a request but mark it as unchanged and valid so that the user can open a workbook without getting nagged
        const entry = new EditableRequest()
        entry.id = GenerateIdentifier()
        entry.runs = 1
        entry.name = 'New Request'
        entry.test = `describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})`
        entry.dirty = false
        this.requests.add(entry, false, null)
        this.dirty = false
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    @action
    loadWorkspace(newWorkspace: Workspace, fileName: string, displayName: string) {
        this.requests = new IndexedEntityManager(
            new Map(Object.entries(newWorkspace.requests.entities).map(([id, e]) =>
                [id,
                    (e as unknown as Request)['url'] === undefined
                        ? EditableRequestGroup.fromWorkspace(e as RequestGroup)
                        : EditableRequest.fromWorkspace(e as Request)
                ]
            )),
            newWorkspace.requests.topLevelIds,
            new Map(Object.entries(newWorkspace.requests.childIds)),
        )
        this.scenarios = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.scenarios.entities).map((e) =>
                [e.id, EditableScenario.fromWorkspace(e)]
            )),
            newWorkspace.scenarios.topLevelIds,
            new Map(Object.entries(newWorkspace.scenarios.childIds)),
        )

        this.authorizations = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.authorizations.entities).map((e) =>
                [e.id, EditableAuthorization.fromWorkspace(e)]
            )),
            newWorkspace.authorizations.topLevelIds,
            new Map(Object.entries(newWorkspace.authorizations.childIds)),
        )

        this.certificates = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.certificates.entities).map((e) =>
                [e.id, EditableCertificate.fromWorkspace(e)]
            )),
            newWorkspace.certificates.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.certificates.childIds)),
        )

        this.proxies = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.proxies.entities).map((e) =>
                [e.id, EditableProxy.fromWorkspace(e)]
            )),
            newWorkspace.proxies.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.proxies.childIds)),
        )

        this.defaults = EditableDefaults.fromWorkspace(
            newWorkspace,
            new IndexedEntityManager(
                new Map(Object.values(newWorkspace.data.entities).map((e) =>
                    [e.id, EditableExternalData.fromWorkspace(e)]
                )),
                newWorkspace.data.topLevelIds ?? [],
                new Map(Object.entries(newWorkspace.data.childIds)),
            )
        )

        this.warnings.set(newWorkspace.warnings)

        const expandedItems = ['hdr-r']
        if (this.requests.childIds) {
            for (const groupId of this.requests.childIds.keys()) {
                expandedItems.push(`g-${groupId}`)
            }
        }
        this.expandedItems = expandedItems

        for (const entity of this.requests.values) {
            if (entity.state === EditableState.Warning) this.invalidItems.add(entity.id)
        }
        for (const entity of this.scenarios.values) {
            if (entity.state === EditableState.Warning) this.invalidItems.add(entity.id)
        }
        for (const entity of this.authorizations.values) {
            if (entity.state === EditableState.Warning) this.invalidItems.add(entity.id)
        }
        for (const entity of this.certificates.values) {
            if (entity.state === EditableState.Warning) this.invalidItems.add(entity.id)
        }
        for (const entity of this.proxies.values) {
            if (entity.state === EditableState.Warning) this.invalidItems.add(entity.id)
        }
        this.active = this.warnings.hasEntries ? this.warnings : null
        this.workbookFullName = fileName
        this.workbookDisplayName = displayName
        this.dirty = false
        this.warnOnWorkspaceCreds = true
        this.executions.clear()
        this.invalidItems.clear()
        this.pendingPkceRequests.clear()
    }

    @action
    updateSavedLocation(fileName: string, displayName: string) {
        this.workbookFullName = fileName
        this.workbookDisplayName = displayName
        this.dirty = false
    }

    getWorkspace() {
        return editableWorkspaceToStoredWorkspace(
            this.requests,
            this.scenarios,
            this.authorizations,
            this.certificates,
            this.proxies,
            this.defaults.data,
            this.defaults,
        )
    }

    @action
    toggleExpanded(itemId: string, isExpanded: boolean) {
        let expanded = new Set(this.expandedItems)
        if (isExpanded) {
            expanded.add(itemId)
        } else {
            expanded.delete(itemId)
        }
        this.expandedItems = [...expanded]
    }

    @action
    changeActive(type: EditableEntityType, id: string) {
        this.activeId = `${type}-${id}`
        switch (type) {
            case EditableEntityType.Workbook:
                switch (id) {
                    case 'console':
                        this.mode = WorkspaceMode.Console;
                        break
                    case 'settings':
                        this.mode = WorkspaceMode.Settings;
                        break
                    case 'defaults':
                        this.mode = WorkspaceMode.Defaults;
                        break
                }
                break
            case EditableEntityType.Request:
            case EditableEntityType.Group:
                this.mode = WorkspaceMode.Normal
                if (id.length > 0) {
                    const r = this.requests.get(id)
                    if (!r) throw new Error(`Invalid request ID ${id}`)
                    this.active = r
                } else {
                    this.active = null;
                }
                break
            case EditableEntityType.Scenario:
                this.mode = WorkspaceMode.Normal
                const s = this.scenarios.get(id)
                if (!s) throw new Error(`Invalid scenario ID ${id}`)
                this.active = s
                break
            case EditableEntityType.Authorization:
                this.mode = WorkspaceMode.Normal
                const a = this.authorizations.get(id)
                if (!a) throw new Error(`Invalid authorization ID ${id}`)
                this.active = a
                break
            case EditableEntityType.Certificate:
                this.mode = WorkspaceMode.Normal
                const c = this.certificates.get(id)
                if (!c) throw new Error(`Invalid certificate ID ${id}`)
                this.active = c
                break
            case EditableEntityType.Proxy:
                this.mode = WorkspaceMode.Normal
                const p = this.proxies.get(id)
                if (!p) throw new Error(`Invalid proxy ID ${id}`)
                this.active = p
                break
            case EditableEntityType.Warnings:
                this.mode = WorkspaceMode.Normal
                this.active = this.warnings
                this.nextHelpTopic = 'settings'
                break
            default:
                this.active = null
                this.mode = WorkspaceMode.Normal
                break
        }
    }

    @action
    clearActive() {
        this.active = null
        this.activeId = null
    }

    /**
     * Generate a list of entities, including default and none selections, returns list and selected ID
     * @param index
     * @param defaultName 
     * @returns tuple of list and selected ID
     */
    private buildParameterList = <T extends Identifiable & Named>(
        index: IndexedEntityManager<T>,
        defaultName?: string): EntitySelection[] => {
        const list: EntitySelection[] = []
        if (defaultName !== undefined) {
            list.push({ id: DEFAULT_SELECTION_ID, name: `Default (${defaultName})` })
        }
        list.push({ id: NO_SELECTION_ID, name: `Off` })

        // Get the public, private and global values
        for (const persistence of [Persistence.Workbook, Persistence.Private, Persistence.Vault]) {
            for (const entity of index.getChildren(persistence)) {
                list.push({ id: entity.id, name: GetTitle(entity) })
            }
        }

        return list
    }

    @action
    addRequest(targetID?: string | null) {
        const entry = new EditableRequest()
        entry.id = GenerateIdentifier()
        entry.runs = 1
        entry.test = `describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})`
        this.requests.add(entry, false, targetID)
        this.dirty = true
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    @action
    deleteRequest(id: string) {
        if (this.active?.id === id) {
            this.clearActive()
        }
        this.requests.remove(id)
        this.executions.delete(id)
        this.dirty = true
    }

    @action
    moveRequest(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.requests.move(id, destinationID, onLowerHalf, onLeft)
        this.dirty = true
        if (this.active?.id !== id) {
            this.changeActive(EditableEntityType.Request, id)
        }
    }

    @action
    copyRequest(id: string) {
        const copySeletion = (selection?: Selection) => {
            return selection
                ? { id: selection.id, name: selection.name } as Selection
                : undefined
        }
        // Return the ID of the duplicated entry
        const copyEntry = (entry: EditableRequest | EditableRequestGroup, appendCopySuffix: boolean) => {
            if (entry.entityType === EditableEntityType.Request) {
                const request = new EditableRequest()
                request.id = GenerateIdentifier()
                request.name = `${GetTitle(entry)}${appendCopySuffix ? ' - copy' : ''}`
                request.runs = entry.runs
                request.dirty = true
                request.url = entry.url
                request.method = entry.method
                request.mode = entry.mode
                request.timeout = entry.timeout
                request.headers = entry.headers.map(h => ({ ...h, id: GenerateIdentifier() } as EditableNameValuePair))
                request.queryStringParams = entry.queryStringParams.map(q => ({ ...q, id: GenerateIdentifier() } as EditableNameValuePair))
                request.body = entry.body
                    ? structuredClone(toJS(entry.body))
                    : { type: BodyType.None, data: undefined }
                request.test = entry.test
                request.selectedScenario = copySeletion(entry.selectedScenario)
                request.selectedAuthorization = copySeletion(entry.selectedAuthorization)
                request.selectedCertificate = copySeletion(entry.selectedCertificate)
                request.selectedProxy = copySeletion(entry.selectedProxy)

                this.requests.set(request.id, request)
                return request
            }

            const group = new EditableRequestGroup()
            group.id = GenerateIdentifier()
            group.name = `${GetTitle(entry)}${appendCopySuffix ? ' - copy' : ''}`
            group.runs = entry.runs
            group.dirty = true
            group.execution = entry.execution
            group.selectedScenario = copySeletion(entry.selectedScenario)
            group.selectedAuthorization = copySeletion(entry.selectedAuthorization)
            group.selectedCertificate = copySeletion(entry.selectedCertificate)
            group.selectedProxy = copySeletion(entry.selectedProxy)

            this.requests.set(group.id, group)

            const sourceChildIDs = this.requests.childIds.get(source.id)
            if (sourceChildIDs && sourceChildIDs.length > 0) {
                const dupedChildIDs: string[] = []
                sourceChildIDs.forEach(childID => {
                    const childEntry = this.requests.get(childID)
                    if (childEntry) {
                        const dupedChildID = copyEntry(childEntry, false).id
                        dupedChildIDs.push(dupedChildID)
                    }
                })
                this.requests.childIds.set(group.id, dupedChildIDs)
            }
            return group
        }

        const source = this.requests.get(id)
        const copiedEntry = copyEntry(source, true)

        this.requests.add(copiedEntry, source.entityType === EditableEntityType.Group, id)

        this.dirty = true
        this.changeActive(EditableEntityType.Request, copiedEntry.id)
    }

    @action
    deleteWorkspaceWarning(warningId: string) {
        this.warnings.delete(warningId)
        if (!this.warnings.hasEntries) {
            this.changeActive(EditableEntityType.None, '')
        }
    }

    @action
    setName(value: string) {
        const namable = this.active as Named
        namable.name = value
        this.dirty = true
    }

    @action
    setRequestUrl(value: string) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.url = value
            request.dirty = true
            this.dirty = true
        }
    }

    @action
    setRequestMethod(value: Method) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.method = value
            this.dirty = true
        }
    }

    @action
    setRequestTimeout(value: number) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.timeout = value
            this.dirty = true
        }
    }

    @action
    setRequestQueryStringParams(value: EditableNameValuePair[] | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.queryStringParams = value ?? []
            this.dirty = true
        }
    }

    @action
    setRequestHeaders(value: EditableNameValuePair[] | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.headers = value ?? []
            this.dirty = true
        }
    }

    @action
    setRequestBodyType(value: BodyType | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            let newBody: Body
            if (request.body && request.body.data) {
                switch (value) {
                    case BodyType.Raw:
                        switch (request.body.type) {
                            case BodyType.Form:
                                newBody = {
                                    type: BodyType.Raw, data: base64Encode((new TextEncoder()).encode(
                                        encodeFormData(request.body.data as EditableNameValuePair[])
                                    ))
                                }
                                break
                            case BodyType.XML:
                            case BodyType.JSON:
                            case BodyType.Text:
                                newBody = { type: BodyType.Raw, data: base64Encode((new TextEncoder()).encode(request.body.data)) }
                                break
                            case BodyType.Raw:
                                newBody = { type: BodyType.Raw, data: request.body.data }
                                break
                            default:
                                newBody = {
                                    type: BodyType.Raw, data: ''
                                }
                        }
                        break
                    case BodyType.Form:
                        switch (request.body.type) {
                            case BodyType.JSON:
                            case BodyType.XML:
                            case BodyType.Text:
                            case BodyType.Raw:
                                newBody = {
                                    type: BodyType.Form,
                                    data: decodeFormData(request.body.data)
                                }
                                break
                            case BodyType.Form:
                                newBody = { type: BodyType.Form, data: request.body.data }
                                break
                            default:
                                newBody = {
                                    type: BodyType.Form, data: []
                                }
                                break
                        }
                        break
                    case BodyType.JSON:
                    case BodyType.XML:
                    case BodyType.Text:
                        switch (request.body.type) {
                            case BodyType.JSON:
                            case BodyType.XML:
                            case BodyType.Text:
                                newBody = { type: value, data: request.body.data }
                                break
                            case BodyType.Raw:
                                newBody = { type: value, data: (new TextDecoder()).decode(base64Decode(request.body.data)) }
                                break
                            default:
                                newBody = { type: BodyType.None, data: undefined }
                                break
                        }
                        break
                    case BodyType.None:
                    default:
                        newBody = {
                            type: BodyType.None,
                            data: undefined
                        }

                }
            } else {
                switch (value) {
                    case BodyType.Form:
                        newBody = {
                            type: BodyType.Form,
                            data: []
                        }
                        break
                    case BodyType.XML:
                    case BodyType.JSON:
                    case BodyType.Text:
                        newBody = {
                            type: value,
                            data: ''
                        }
                        break
                    case BodyType.None:
                    default:
                        newBody = {
                            type: BodyType.None,
                            data: undefined
                        }
                        break
                }

            }

            request.body = newBody
            this.dirty = true
        }
    }

    @action
    setRequestBody(body: Body) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.body = body
            this.dirty = true
        }
    }

    @action
    setRequestBodyData(value: string | EditableNameValuePair[]) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.body.data = value
            this.dirty = true
        }
    }

    @action
    setRequestRuns(value: number) {
        switch (this.active?.entityType) {
            case EditableEntityType.Request:
                const request = this.active as EditableRequest
                request.runs = value
                this.dirty = true
                break
            case EditableEntityType.Group:
                const group = this.active as EditableRequestGroup
                group.runs = value
                this.dirty = true
                break
        }
    }

    @action
    setRequestTest(value: string | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.test = value ?? ''
            this.dirty = true
        }
    }

    @action
    setRequestSelectedScenarioId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableRequest
            request.selectedScenario = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.scenarios.get(entityId)) }
            this.dirty = true
        }
    }

    setRequestSelectedAuthorizationId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableRequest
            request.selectedAuthorization = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.authorizations.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setRequestSelectedCertificateId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableRequest
            request.selectedCertificate = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.certificates.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setRequestSelectedProxyId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableRequest
            request.selectedProxy = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.proxies.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    deleteRequestWarning(warningId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableRequest
            if (request.warnings) {
                request.warnings.delete(warningId)
            }
        }
    }

    getRequestActiveAuthorization(request: EditableRequest | EditableRequestGroup) {
        let r: EditableRequest | EditableRequestGroup | null | undefined = request
        while (r) {
            const authId = r.selectedAuthorization?.id ?? null
            switch (authId) {
                case DEFAULT_SELECTION_ID:
                case null:
                    // get parent
                    break
                case NO_SELECTION_ID:
                    return undefined
                default:
                    return this.authorizations.get(authId)
            }
            r = this.requests.findParent(r.id)
        }
        return (this.defaults.selectedAuthorization.id && this.defaults.selectedAuthorization.id != NO_SELECTION_ID)
            ? this.authorizations.get(this.defaults.selectedAuthorization?.id)
            : undefined
    }

    /**
     * Navigate from the hierarchy to get the parameters for the active request
     * @returns 
     */
    getActiveParameters(): {
        scenario: Selection,
        authorization: Selection,
        certificate: Selection,
        proxy: Selection,
        data: Selection
    } {
        let scenario = DEFAULT_SELECTION
        let authorization = DEFAULT_SELECTION
        let certificate = DEFAULT_SELECTION
        let proxy = DEFAULT_SELECTION
        let data = DEFAULT_SELECTION

        // Determine the active credentials by working our way up the hierarchy
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableRequest
            let e = this.requests.findParent(request.id)
            while (e) {
                let r = e as (EditableRequest & EditableRequest)
                if (scenario.id === DEFAULT_SELECTION_ID && r.selectedScenario) {
                    scenario = r.selectedScenario
                }
                if (authorization.id === DEFAULT_SELECTION_ID && r.selectedAuthorization) {
                    authorization = r.selectedAuthorization
                }
                if (certificate.id === DEFAULT_SELECTION_ID && r.selectedCertificate) {
                    certificate = r.selectedCertificate
                }
                if (proxy.id === DEFAULT_SELECTION_ID && r.selectedProxy) {
                    proxy = r.selectedProxy
                }
                if (data.id === DEFAULT_SELECTION_ID && r.selectedData) {
                    data = r.selectedData
                }

                if (scenario.id !== DEFAULT_SELECTION_ID
                    && authorization.id !== DEFAULT_SELECTION_ID
                    && certificate.id !== DEFAULT_SELECTION_ID
                    && proxy.id !== DEFAULT_SELECTION_ID
                    && data.id !== DEFAULT_SELECTION_ID
                ) {
                    break
                }

                e = this.requests.findParent(e.id)
            }
        }

        return {
            scenario,
            authorization,
            certificate,
            proxy,
            data
        }

    }

    getRequestParameterLists() {
        const active = this.getActiveParameters()

        const defaultScenario = active.scenario.id == DEFAULT_SELECTION_ID
            ? this.defaults.selectedScenario.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.defaults.selectedScenario)
            : active.scenario.id === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(active.scenario)

        const defaultAuthorization = active.authorization.id == DEFAULT_SELECTION_ID
            ? this.defaults.selectedAuthorization.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.defaults.selectedAuthorization)
            : active.authorization.id === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(active.authorization)

        const defaultCertificate = active.certificate.id == DEFAULT_SELECTION_ID
            ? this.defaults.selectedCertificate.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.defaults.selectedCertificate)
            : active.certificate.id === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(active.certificate)

        const defaultProxy = active.proxy.id == DEFAULT_SELECTION_ID
            ? this.defaults.selectedProxy.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.defaults.selectedProxy)
            : active.proxy.id === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(active.proxy)

        const defaultData = active.data.name == DEFAULT_SELECTION_ID
            ? this.defaults.selectedData.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.defaults.selectedData)
            : active.data.id === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(active.data)

        return {
            scenarios: this.buildParameterList(this.scenarios, defaultScenario),
            authorizations: this.buildParameterList(this.authorizations, defaultAuthorization),
            certificates: this.buildParameterList(this.certificates, defaultCertificate),
            proxies: this.buildParameterList(this.proxies, defaultProxy),
            data: this.buildParameterList(this.defaults.data, defaultData),
        }
    }

    getDefaultParameterLists() {
        return {
            scenarios: this.buildParameterList(this.scenarios),
            authorizations: this.buildParameterList(this.authorizations),
            certificates: this.buildParameterList(this.certificates),
            proxies: this.buildParameterList(this.proxies),
            data: this.buildParameterList(this.defaults.data)
        }
    }

    getStoredWorkspace() {
        return editableWorkspaceToStoredWorkspace(
            this.requests,
            this.scenarios,
            this.authorizations,
            this.certificates,
            this.proxies,
            this.defaults.data,
            this.defaults,
        )
    }

    @action
    addGroup(targetID?: string | null) {
        const entry = new EditableRequestGroup()
        entry.id = GenerateIdentifier()
        entry.runs = 1
        this.requests.add(entry, true, targetID)
        this.dirty = true
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    @action
    deleteGroup(id: string) {
        this.deleteRequest(id)
    }

    @action
    moveGroup(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.moveRequest(id, destinationID, onLeft, onLowerHalf)
    }

    @action
    copyGroup(id: string) {
        this.copyRequest(id)
    }

    @action
    setGroupExecution(value: GroupExecution) {
        if (this.active?.entityType === EditableEntityType.Group) {
            const group = this.active as EditableRequestGroup
            group.execution = value
            this.dirty = true
        }
    }

    @action
    setMultiRunExecution(value: GroupExecution) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableRequest
            request.multiRunExecution = value
            this.dirty = true
        } else if (this.active?.entityType === EditableEntityType.Group) {
            const group = this.active as EditableRequestGroup
            group.multiRunExecution = value
            this.dirty = true
        }
    }

    @action
    addScenario(persistence: Persistence, targetID?: string | null) {
        const scenario = new EditableScenario()
        scenario.id = GenerateIdentifier()
        this.scenarios.add(scenario, false, targetID || persistence)
        this.changeActive(EditableEntityType.Scenario, scenario.id)
        this.dirty = true
    }

    @action
    deleteScenario(id: string) {
        for (const entity of this.requests.values) {
            if (entity.selectedScenario?.id === id) {
                entity.selectedScenario = undefined
            }
        }
        if (this.defaults.selectedScenario.id == id) {
            this.defaults.selectedScenario = NO_SELECTION
        }
        this.scenarios.remove(id)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveScenario(id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) {
        this.scenarios.move(id, destinationID, onLowerHalf, isSection)
        this.dirty = true
        // if (selectedScenario !== NO_SELECTION) {
        //     activateScenario(id)
        // }
    }

    @action
    copyScenario(id: string) {
        const source = this.scenarios.get(id)
        if (!source) return
        const scenario = new EditableScenario()
        scenario.id = GenerateIdentifier()
        scenario.name = `${GetTitle(source)} - Copy`
        scenario.dirty = true
        scenario.variables = source.variables.map(v => new EditableVariable(
            GenerateIdentifier(),
            v.name,
            v.type,
            v.value,
            v.disabled
        ))
        this.scenarios.add(scenario, false, id)
        this.dirty = true
        this.changeActive(EditableEntityType.Scenario, scenario.id)
    }

    @action
    setScenarioVariables(value: EditableVariable[] | undefined) {
        if (this.active?.entityType === EditableEntityType.Scenario) {
            const scenario = this.active as EditableScenario
            scenario.variables = value || []
        }
    }

    @action
    addAuthorization(persistence: Persistence, targetID?: string | null) {
        const authorization = new EditableAuthorization()
        authorization.id = GenerateIdentifier()
        this.authorizations.add(authorization, false, targetID ?? persistence)
        this.changeActive(EditableEntityType.Authorization, authorization.id)
        this.dirty = true
    }

    @action
    deleteAuthorization(id: string) {
        for (const entity of this.requests.values) {
            if (entity.selectedAuthorization?.id === id) {
                entity.selectedAuthorization = undefined
            }
        }
        if (this.defaults.selectedAuthorization.id == id) {
            this.defaults.selectedAuthorization = NO_SELECTION
        }

        this.authorizations.remove(id)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveAuthorization(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.authorizations.move(id, destinationID, onLowerHalf, onLeft)
        this.dirty = true
        // if (selectedAuthorizationId !== id) {
        //     activateAuthorization(id)
        // }
    }

    @action
    copyAuthorization(id: string) {
        const source = this.authorizations.get(id)
        if (!source) return
        const authorization = new EditableAuthorization()
        authorization.id = GenerateIdentifier()
        authorization.name = `${GetTitle(source)} - Copy`
        authorization.type = source.type
        authorization.dirty = true
        authorization.header = source.header
        authorization.value = source.value
        authorization.username = source.username
        authorization.password = source.password
        authorization.accessTokenUrl = source.accessTokenUrl
        authorization.authorizeUrl = source.authorizeUrl
        authorization.clientId = source.clientId
        authorization.clientSecret = source.clientSecret
        authorization.scope = source.scope
        authorization.selectedCertificate = source.selectedCertificate
        authorization.selectedProxy = source.selectedProxy

        this.authorizations.add(authorization, false, id)
        this.dirty = true
        this.changeActive(EditableEntityType.Authorization, authorization.id)
    }

    getAuthorizationCertificateList() {
        return this.buildParameterList(this.certificates)
    }

    getAuthorizationProxyList() {
        return this.buildParameterList(this.proxies)
    }

    @action
    setAuthorizationType(value: AuthorizationType.ApiKey | AuthorizationType.Basic
        | AuthorizationType.OAuth2Client | AuthorizationType.OAuth2Pkce) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.type = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationUsername(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.username = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationPassword(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.password = value
            this.dirty = true
        }
    }

    @action
    setAccessTokenUrl(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.accessTokenUrl = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationUrl(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.authorizeUrl = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationClientId(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.clientId = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationClientSecret(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.clientSecret = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationScope(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.scope = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationSelectedCertificateId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.selectedCertificate =
                entityId === DEFAULT_SELECTION_ID
                    ? undefined
                    : entityId == NO_SELECTION_ID
                        ? NO_SELECTION
                        : { id: entityId, name: GetTitle(this.certificates.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setAuthorizationSelectedProxyId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.selectedProxy =
                entityId === DEFAULT_SELECTION_ID
                    ? undefined
                    : entityId == NO_SELECTION_ID
                        ? NO_SELECTION
                        : { id: entityId, name: GetTitle(this.proxies.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setAuthorizationHeader(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.header = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationValue(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableAuthorization
            auth.value = value
            this.dirty = true
        }
    }

    @action
    addCertificate(persistence: Persistence, targetID?: string | null) {
        const certificate = new EditableCertificate()
        certificate.id = GenerateIdentifier()
        this.certificates.add(certificate, false, targetID || persistence)
        this.changeActive(EditableEntityType.Certificate, certificate.id)
        this.dirty = true
    }

    @action
    deleteCertificate(id: string) {
        for (const entity of this.requests.values) {
            if (entity.selectedCertificate?.id === id) {
                entity.selectedCertificate = undefined
            }
        }
        if (this.defaults.selectedCertificate.id == id) {
            this.defaults.selectedCertificate = NO_SELECTION
        }

        this.certificates.remove(id)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveCertificate(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.certificates.move(id, destinationID, onLowerHalf, onLeft)
        this.dirty = true
    }

    @action
    copyCertificate(id: string) {
        const source = this.certificates.get(id)
        if (!source) return
        const certificate = new EditableCertificate()
        certificate.id = GenerateIdentifier()
        certificate.name = `${GetTitle(source)} - Copy`
        certificate.type = source.type
        certificate.dirty = true
        certificate.pem = source.pem
        certificate.key = source.key
        certificate.pfx = source.pfx
        certificate.password = source.password

        this.certificates.add(certificate, false, id)
        this.dirty = true
        this.changeActive(EditableEntityType.Certificate, certificate.id)
    }

    @action
    setCertificateType(value: CertificateType.PEM | CertificateType.PKCS8_PEM | CertificateType.PKCS12) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableCertificate
            certificate.type = value
            this.dirty = true
        }
    }

    @action
    setCertificatePem(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableCertificate
            certificate.pem = value
            this.dirty = true
        }
    }

    @action
    setCertificateKey(value: string | undefined) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableCertificate
            certificate.key = value || ''
            this.dirty = true
        }
    }

    @action
    setCertificatePfx(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableCertificate
            certificate.pfx = value
            this.dirty = true
        }
    }

    @action
    setCertificatePassword(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableCertificate
            certificate.password = value
            this.dirty = true
        }
    }

    @action
    addProxy(persistence: Persistence, targetID?: string | null) {
        const proxy = new EditableProxy()
        proxy.id = GenerateIdentifier()
        this.proxies.add(proxy, false, targetID || persistence)
        this.changeActive(EditableEntityType.Proxy, proxy.id)
        this.dirty = true
    }

    @action
    deleteProxy(id: string) {
        for (const entity of this.requests.values) {
            if (entity.selectedProxy?.id === id) {
                entity.selectedProxy = undefined
            }
        }
        if (this.defaults.selectedProxy.id == id) {
            this.defaults.selectedProxy = NO_SELECTION
        }
        this.proxies.remove(id)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveProxy(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.proxies.move(id, destinationID, onLowerHalf, onLeft)
        this.dirty = true
        // if (selectedProxyId !== id) {
        //     activateProxy(id)
        // }
    }

    @action
    copyProxy(id: string) {
        const source = this.proxies.get(id)
        if (source) {
            const proxy = new EditableProxy()
            proxy.id = GenerateIdentifier()
            proxy.name = `${GetTitle(source)} - Copy`
            proxy.url = source.url
            proxy.dirty = true

            this.proxies.add(proxy, false, id)
            this.dirty = true
            this.changeActive(EditableEntityType.Proxy, proxy.id)
        }
    }

    @action
    setProxyUrl(url: string) {
        if (this.active?.entityType === EditableEntityType.Proxy) {
            const proxy = this.active as EditableProxy
            proxy.url = url
            this.dirty = true
        }
    }

    @action
    addData() {
        const data = new EditableExternalData()
        data.id = GenerateIdentifier()
        this.defaults.data.add(data, false, Persistence.Workbook)
        // this.changeActive(EditableEntityType.ExternalData, data.id)
        this.dirty = true
    }

    @action
    deleteData(id: string) {
        for (const request of this.requests.values) {
            if (request.selectedData?.id === id) {
                request.selectedData = NO_SELECTION
            }
        }
        if (this.defaults.selectedData.id == id) {
            this.defaults.selectedData = NO_SELECTION
        }
        this.defaults.data.remove(id)
        // this.clearActive()
        this.dirty = true
    }

    @action
    getExecution(requestOrGroupId: string) {
        let execution = this.executions.get(requestOrGroupId)
        if (!execution) {
            execution = new ExecutionEntry(requestOrGroupId)
            this.executions.set(requestOrGroupId, execution)
        }
        return execution
    }

    @action
    deleteExecution(requestOrGroupId: string) {
        this.executions.delete(requestOrGroupId)
    }

    getExecutionResult(requestOrGroupId: string, index: number): ExecutionResult | undefined {
        return this.executions.get(requestOrGroupId)?.results[index]
    }

    getExecutionResultSummary(requestOrGroupId: string, index: number): ExecutionResultSummary | null {
        const result = this.executions.get(requestOrGroupId)?.results[index]
        if (!result) return null;

        const renderSummary = (index: number): ExecutionResultSummary | undefined => {
            const result = this.executions.get(requestOrGroupId)?.results[index]
            if (!result) return undefined

            const isRequest = result.request !== undefined

            const children: ExecutionResultSummary[] = []
            if (result.info.childIndexes) {
                for (const childIndex of result.info.childIndexes) {
                    const child = renderSummary(childIndex)
                    if (child) children.push(child)
                }
            }

            return {
                title: result.info.title,
                runNumber: result.info.runNumber,
                rowNumber: result.info.rowNumber,
                executedAt: result.executedAt,
                duration: result.duration,
                success: result.success,
                request: result.request,
                response: result.response,
                error: result.error,
                tests: result.tests?.map(test => ({
                    testName: test.testName.join(' '),
                    success: test.success,
                    error: test.error ? test.error : undefined,
                    logs: (test.logs && test.logs.length > 0) ? test.logs : undefined
                })),
                requestSuccessCount: isRequest
                    ? undefined
                    : result.requestSuccessCount,
                requestFailureCount: isRequest
                    ? undefined
                    : result.requestFailureCount,
                requestErrorCount: isRequest
                    ? undefined
                    : result.requestErrorCount,
                testPassCount: result.testPassCount,
                testFailCount: result.testFailCount,
                children: children.length > 0 ? children : undefined
            }
        }

        const data = renderSummary(index)
        if (data) {
            return data
        } else {
            throw new Error('Invalid request and/or index')
        }
    }

    @action
    reportExecutionResults(execution: Execution, executionResults: ApicizeResult) {
        execution.running = false
        const previousPanel = execution.panel

        const menu: ExecutionMenuItem[] = []
        const results: ExecutionResult[] = []

        const appendResult = (result: ExecutionResult, level: number) => {
            let index = results.length
            results.push(result)
            result.info.index = index
            menu.push({
                title: result.info.title,
                level,
                index,
            })
            return result.info.index
        }

        const processGroupItem = (item: ApicizeGroupItem, parentIndex: number | undefined, level: number, overrideTitle?: string): number => {
            switch (item.type) {
                case 'Group':
                    return processGroup(item, parentIndex, level, overrideTitle)
                case 'Request':
                    return processRequest(item, parentIndex, level, overrideTitle)
            }
        }

        const processGroup = (group: ApicizeGroup, parentIndex: number | undefined, level: number, overrideTitle?: string): number => {
            const result = executionResultFromSummary(
                {
                    index: 0,
                    parentIndex,
                    title: overrideTitle
                        ? overrideTitle
                        : group.name.length > 0 ? group.name : 'Unnamed Group'
                },
                group
            )
            const index = appendResult(result, level)
            if (group.children) {
                const childIds: number[] = []
                switch (group.children.type) {
                    case 'Items':
                        for (const child of group.children.items) {
                            childIds.push(processGroupItem(child, index, level + 1))
                        }
                        break
                    case 'Runs':
                        const count = group.children.items.length
                        for (const run of group.children.items) {
                            let result = executionResultFromSummary({
                                index: 0,
                                parentIndex: index,
                                title: `Run ${run.runNumber} of ${count}`,
                                // runNumber: run.runNumber,
                                // runCount: count,
                            }, run)
                            let runIndex = appendResult(result, level + 1)
                            childIds.push(runIndex)

                            if (run.children) {
                                const childIndexes = []
                                for (const grandChild of run.children) {
                                    let gcIndex: number
                                    switch (grandChild.type) {
                                        case 'Group':
                                            childIndexes.push(processGroup(grandChild, runIndex, level + 2))
                                            break
                                        case 'Request':
                                            childIndexes.push(processRequest(grandChild, runIndex, level + 2))
                                            break
                                    }
                                }
                                if (childIndexes.length > 0) {
                                    result.info.childIndexes = childIndexes
                                }
                            }
                        }
                        break
                }
                if (childIds.length > 0) {
                    result.info.childIndexes = childIds
                }
            }
            return index
        }

        const processRequest = (request: ApicizeRequest, parentIndex: number | undefined, level: number, overrideTitle?: string): number => {
            const result = executionResultFromRequest(
                {
                    index: 0,
                    parentIndex: parentIndex,
                    title: overrideTitle
                        ? overrideTitle
                        : request.name.length > 0 ? request.name : 'Unnamed Request'
                },
                request,
                (request.execution && request.execution.type == 'Single') ? request.execution : undefined)


            const index = appendResult(result, level)
            if (request.execution) {
                const childIds: number[] = []
                switch (request.execution.type) {
                    case 'Runs':
                        const runCount = request.execution.items.length
                        for (const runExecution of request.execution.items) {
                            const runResult = executionResultFromExecution(
                                {
                                    index: 0,
                                    parentIndex: index,
                                    title: `Run ${runExecution.runNumber} of ${runCount}`,
                                    runNumber: runExecution.runNumber,
                                    runCount
                                },
                                runExecution
                            )
                            childIds.push(appendResult(runResult, level + 1))
                        }
                        break
                }
                if (childIds.length > 0) {
                    result.info.childIndexes = childIds
                }
            }

            return index
        }

        const processRows = (summary: ApicizeRowSummary, parentIndex: number | undefined, level: number) => {
            const rowCount = summary.rows.length

            const request = this.requests.get(execution.requestOrGroupId)

            const result = executionResultFromSummary({
                index: 0,
                parentIndex,
                title: request.name ? `${request.name} (All Rows)` : 'All Rows'
            }, summary)
            const index = appendResult(result, level)

            const childIndexes: number[] = []
            for (const row of summary.rows) {
                if (row.items.length == 1) {
                    childIndexes.push(processGroupItem(row.items[0], index, level + 1, `Row ${row.rowNumber} of ${rowCount}`))
                } else {
                    const rowResult = executionResultFromSummary(
                        {
                            index: 0,
                            parentIndex: index,
                            title: `Row ${row.rowNumber} of ${rowCount}`
                        },
                        summary
                    )
                    const rowIndex = appendResult(rowResult, level)
                    const rowChildIndexes = []
                    for (const item of row.items) {
                        rowChildIndexes.push(processGroupItem(row.items[0], rowIndex, level + 2))
                    }

                    rowResult.info.childIndexes = rowChildIndexes
                }
            }
            result.info.childIndexes = childIndexes
        }

        let success = true
        switch (executionResults.type) {
            case 'Rows':
                processRows(executionResults, undefined, 0)
                success &&= executionResults.success
                break
            case 'Items':
                for (const item of executionResults.items) {
                    processGroupItem(item, undefined, 0)
                    success &&= item.success
                }
                break
        }

        let oldLength = execution.results.length
        execution.resultMenu = menu
        execution.results = results
        execution.resultIndex = (isNaN(execution.resultIndex) || execution.resultIndex >= execution.results.length || execution.results.length != oldLength)
            ? 0 : execution.resultIndex
        execution.panel = (previousPanel && success) ? previousPanel : 'Info'

    }


    // @action
    // reportExecutionComplete(execution: Execution) {
    //     execution.running = false
    // }

    @action
    async executeRequest(requestOrGroupId: string, singleRun: boolean = false) {
        const requestOrGroup = this.requests.get(requestOrGroupId)
        let execution = this.executions.get(requestOrGroupId)
        if (execution) {
            execution.running = true
        } else {
            execution = new ExecutionEntry(requestOrGroupId)
            execution.running = true
            this.executions.set(requestOrGroupId, execution)
        }

        if (!(execution && requestOrGroup)) throw new Error(`Invalid ID ${requestOrGroupId}`)

        // Check if PKCE and initialize PKCE flow, queuing request upon completion
        const auth = this.getRequestActiveAuthorization(requestOrGroup)
        if (auth?.type === AuthorizationType.OAuth2Pkce) {
            if (auth.accessToken === undefined) {
                this.addPendingPkceRequest(auth.id, requestOrGroupId, singleRun)
                this.callbacks.onInitializePkce({
                    authorizationId: auth.id
                })
                return
            } else if (auth.expiration) {
                const nowInSec = Date.now() / 1000
                if (auth.expiration - nowInSec < 3) {
                    this.addPendingPkceRequest(auth.id, requestOrGroupId, singleRun)
                    this.callbacks.onRefreshToken({
                        authorizationId: auth.id
                    })
                    return
                }
            }
        }

        let idx = this.executingRequestIDs.indexOf(execution.requestOrGroupId)
        if (idx === -1) {
            this.executingRequestIDs.push(requestOrGroupId)
        }

        try {
            let workspace = this.getWorkspace()

            const clearTimeouts = (entry: RequestEntry) => {
                const r = entry as Request
                if (r.url) {
                    r.timeout = undefined
                } else {
                    const childIds = workspace.requests.childIds[entry.id]
                    if (childIds) {
                        for (const childId of childIds) {
                            const child = workspace.requests.entities[childId]
                            if (child) {
                                clearTimeouts(child)
                            }
                        }
                    }
                }
            }

            if (singleRun) {
                const r = workspace.requests.entities[requestOrGroupId]
                if (r) {
                    r.runs = 1
                    clearTimeouts(r)
                }
            }

            let executionResults = await this.callbacks.onExecuteRequest(
                workspace,
                requestOrGroupId,
                this.workbookFullName,
                singleRun)
            this.reportExecutionResults(execution, executionResults)
        } finally {
            this.reportExecutionComplete(execution)
        }
    }

    @action
    reportExecutionComplete(execution: Execution) {
        let idx = this.executingRequestIDs.indexOf(execution.requestOrGroupId)
        if (idx !== -1) {
            this.executingRequestIDs.splice(idx, 1)
        }
        execution.running = false
    }


    @action
    cancelRequest(requestOrGroupId: string) {
        const match = this.executions.get(requestOrGroupId)
        if (match) {
            match.running = false
        }

        let idx = this.executingRequestIDs.indexOf(requestOrGroupId)
        if (idx !== -1) {
            this.executingRequestIDs.splice(idx, 1)
        }
        return this.callbacks.onCancelRequest(requestOrGroupId)
    }

    @action
    async clearTokens() {
        // Clear any PKCE tokens
        for (const auth of this.authorizations.values) {
            if (auth.type === AuthorizationType.OAuth2Pkce) {
                auth.accessToken = undefined
                auth.refreshToken = undefined
                auth.expiration = undefined
            }
        }
        // Clear tokens cached in the Rust library
        await Promise.all(
            this.authorizations.values.map(v => this.callbacks.onClearToken(v.id))
        )
    }

    @action
    changePanel(requestOrGroupId: string, panel: string) {
        const match = this.executions.get(requestOrGroupId)
        if (match) {
            match.panel = panel
        }
    }

    @action
    changeResultIndex(requestOrGroupId: string, resultIndex: number) {
        const execution = this.executions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid Request ID ${requestOrGroupId}`)
        execution.resultIndex = resultIndex
    }

    @action
    setDefaultScenarioId(entityId: string) {
        this.defaults.selectedScenario = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.scenarios.get(entityId)) }
        this.dirty = true
    }

    @action
    setDefaultAuthorizationId(entityId: string) {
        this.defaults.selectedAuthorization = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.authorizations.get(entityId)) }
        this.dirty = true
    }

    @action
    setDefaultCertificateId(entityId: string) {
        this.defaults.selectedCertificate = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.certificates.get(entityId)) }
        this.dirty = true
    }

    @action
    setDefaultProxyId(entityId: string) {
        this.defaults.selectedProxy = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.proxies.get(entityId)) }
        this.dirty = true
    }
    @action
    setDefaultDataId(entityId: string) {
        this.defaults.selectedData = entityId === NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.defaults.data.get(entityId)) }
        this.dirty = true
    }

    @action
    initializePkce(authorizationId: string) {
        this.callbacks.onInitializePkce({
            authorizationId
        })
    }

    /**
     * Update the PKCE authorization and execute any pending requests
     * @param authorizationId 
     * @param accessToken 
     * @param refreshToken 
     * @param expiration 
     */
    @action
    updatePkceAuthorization(authorizationId: string, accessToken: string, refreshToken: string | undefined, expiration: number | undefined) {
        const auth = this.authorizations.get(authorizationId)
        if (!auth) {
            throw new Error('Invalid authorization ID')
        }
        const pendingRequests = [...(this.pendingPkceRequests.get(authorizationId)?.entries() ?? [])]
        this.pendingPkceRequests.delete(authorizationId)

        this.callbacks.onClosePkce({ authorizationId })

        auth.accessToken = accessToken
        auth.refreshToken = refreshToken
        auth.expiration = expiration

        // Execute pending requests
        for (const [requestOrGroupId, singleRun] of pendingRequests) {
            this.executeRequest(requestOrGroupId, singleRun)
        }
    }

    /**
     * Track any requests that should be executed when a PKCE authorization is completed
     * @param authorizationId 
     * @param requestOrGroupId 
     * @param runs 
     */
    private addPendingPkceRequest(authorizationId: string, requestOrGroupId: string, singleRun: boolean) {
        const pendingForAuth = this.pendingPkceRequests.get(authorizationId)
        if (pendingForAuth) {
            pendingForAuth.set(requestOrGroupId, singleRun)
        } else {
            this.pendingPkceRequests.set(authorizationId,
                new Map([[requestOrGroupId, singleRun]]))
        }
    }

    /**
     * Cancel any pending requests
     * @param authorizationId 
     */
    @action
    cancelPendingPkceAuthorization(authorizationId: string) {
        const pending = this.pendingPkceRequests.get(authorizationId)
        if (pending) {
            for (const requestOrGroupId of pending.keys()) {
                const match = this.executions.get(requestOrGroupId)
                if (match) {
                    this.cancelRequest(requestOrGroupId)
                }
            }
        }
        this.pendingPkceRequests.set(authorizationId, new Map())
    }

    @action
    public showHelp(newHelpTopic: string, updateHistory = true) {
        try {
            if (newHelpTopic != this.helpTopic) {
                if (updateHistory && this.helpTopic) {
                    const newHistory = [...this.helpTopicHistory]
                    if (newHistory.length > 10) {
                        newHistory.pop()
                    }
                    newHistory.push(this.helpTopic)
                    this.helpTopicHistory = newHistory
                }
                this.nextHelpTopic = null
                this.helpTopic = newHelpTopic
            }
            this.mode = WorkspaceMode.Help
        } catch (e) {
            console.error(`${e}`)
        }
    }

    @action showNextHelpTopic() {
        this.showHelp(
            (this.nextHelpTopic && this.nextHelpTopic.length > 0) ? this.nextHelpTopic : 'home'
        )
    }

    @action
    public returnToNormal() {
        if (this.active) {
            this.changeActive(this.active.entityType, this.active.id)
        } else {
            this.mode = WorkspaceMode.Normal
        }
    }

    @computed
    public get hasHistory(): boolean {
        return this.helpTopicHistory.length > 0
    }

    @action
    public helpBack() {
        const lastTopic = this.helpTopicHistory.pop()
        if (lastTopic) {
            this.showHelp(lastTopic, false)
        }
    }

    @computed
    public get allowHelpHome() {
        return this.helpTopic !== 'home'
    }

    @computed
    public get allowHelpAbout() {
        return this.helpTopic !== 'about'
    }

    @computed
    public get allowHelpBack() {
        return this.helpTopicHistory.length > 0
    }
}

class ExecutionEntry implements Execution {
    @observable accessor running = false
    @observable accessor resultIndex = NaN
    @observable accessor resultMenu: ExecutionMenuItem[] = []
    @observable accessor results: ExecutionResult[] = []
    @observable accessor panel = 'Info'

    constructor(public readonly requestOrGroupId: string) {
        makeObservable(this)
    }
}

export const WorkspaceContext = createContext<WorkspaceStore | null>(null)

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within a WorkspaceContext.Provider');
    }
    return context;
}

const encodeFormData = (data: EditableNameValuePair[]) =>
    (data.length === 0)
        ? ''
        : data.map(nv =>
            `${encodeURIComponent(nv.name)}=${encodeURIComponent(nv.value)}`
        ).join('&')

const decodeFormData = (bodyData: string | number[] | undefined) => {
    let data: string | undefined;
    if (bodyData instanceof Array) {
        const buffer = Uint8Array.from(bodyData)
        data = (new TextDecoder()).decode(buffer)
    } else {
        data = bodyData
    }
    if (data && data.length > 0) {
        const parts = data.split('&')
        return parts.map(p => {
            const id = GenerateIdentifier()
            const nv = p.split('=')
            if (nv.length == 1) {
                return { id, name: decodeURIComponent(nv[0]), value: "" } as EditableNameValuePair
            } else {
                return { id, name: decodeURIComponent(nv[0]), value: decodeURIComponent(nv[1]) } as EditableNameValuePair
            }
        })
    } else {
        return []
    }
}