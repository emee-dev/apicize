import { action, computed, makeObservable, observable, toJS } from "mobx"
import { DEFAULT_SELECTION, DEFAULT_SELECTION_ID, NO_SELECTION, NO_SELECTION_ID } from "../models/store"
import { Execution, ExecutionMenuItem, ExecutionResult, executionResultFromRequest, executionResultFromExecution, executionResultFromSummary, ExecutionResultSummary } from "../models/workspace/execution"
import { editableWorkspaceToStoredWorkspace } from "../services/apicize-serializer"
import { EditableRequest } from "../models/workspace/editable-request"
import { EditableRequestGroup } from "../models/workspace/editable-request-group"
import { EditableScenario, EditableVariable } from "../models/workspace/editable-scenario"
import { EditableAuthorization } from "../models/workspace/editable-authorization"
import { EditableCertificate } from "../models/workspace/editable-certificate"
import { EditableProxy } from "../models/workspace/editable-proxy"
import {
    Identifiable, Named, GetTitle, GroupExecution, BodyType, AuthorizationType,
    CertificateType, Workspace,
    Selection,
    Persistence,
    Request,
    RequestGroup,
    ApicizeGroup,
    ApicizeGroupItem,
    ApicizeRequest,
    ApicizeResult,
    ApicizeRowSummary,
    RequestEntry,
    ExternalDataSourceType,
} from "@apicize/lib-typescript"
import { EntitySelection } from "../models/workspace/entity-selection"
import { EditableNameValuePair } from "../models/workspace/editable-name-value-pair"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { EditableEntityType } from "../models/workspace/editable-entity-type"
import { EditableState } from "../models/editable"
import { createContext, useContext } from "react"
import { EditableDefaults } from "../models/workspace/editable-defaults"
import { EditableWarnings } from "../models/workspace/editable-warnings"
import { IndexedEntityManager } from "../models/indexed-entity-manager"
import { EditableExternalDataEntry } from "../models/workspace/editable-external-data-entry"
import { RequestEditSessionType, ResultEditSessionType, WorkspaceSessionStore } from "./workspace-session.context"
import { EditableRequestEntry } from "../models/workspace/editable-request-entry"
import { Fold } from "ace-code/src/edit_session/fold"

export type ResultsPanel = 'Info' | 'Headers' | 'Preview' | 'Text' | 'Details'

export enum WorkspaceMode {
    Normal,
    Help,
    Settings,
    Defaults,
    Warnings,
    Seed,
    Console,
    RequestList,
    ScenarioList,
    AuthorizationList,
    CertificateList,
    ProxyList,
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
    @observable accessor defaults: EditableDefaults
    @observable accessor externalData = new IndexedEntityManager<EditableExternalDataEntry>(new Map(), [], new Map())
    @observable accessor warnings = new EditableWarnings()

    /**
     * Apicize executions underway or completed (keyed by request ID)
     */
    @observable accessor executions = new Map<string, Execution>()
    @observable accessor lastExecution: { requestOrGroupId: string } | null = null

    @observable accessor workbookFullName = ''
    @observable accessor workbookDisplayName = '(New)'
    @observable accessor dirty: boolean = false
    @observable accessor warnOnWorkspaceCreds: boolean = true
    @observable accessor invalidItems = new Set<string>()

    @observable accessor executingRequestIDs: string[] = []

    private pendingPkceRequests = new Map<string, Map<string, boolean>>()

    private sessions = new Map<string, WorkspaceSessionStore>()

    constructor(
        private readonly callbacks: {
            onExecuteRequest: (workspace: Workspace, requestId: string, allowedParentPath: string, singleRun: boolean) => Promise<ApicizeResult>,
            onCancelRequest: (requestId: string) => Promise<void>,
            onClearToken: (authorizationId: string) => Promise<void>,
            onInitializePkce: (data: { authorizationId: string }) => Promise<void>,
            onClosePkce: (data: { authorizationId: string }) => Promise<void>,
            onRefreshToken: (data: { authorizationId: string }) => Promise<void>,
        }) {
        this.defaults = new EditableDefaults({}, this)
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

    addSession() {
        const id = GenerateIdentifier()
        const session = new WorkspaceSessionStore(id, this)
        this.sessions.set(id, session)
        return session
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
                [e.id, EditableScenario.fromWorkspace(e, this)]
            )),
            newWorkspace.scenarios.topLevelIds,
            new Map(Object.entries(newWorkspace.scenarios.childIds)),
        )

        this.authorizations = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.authorizations.entities).map((e) =>
                [e.id, EditableAuthorization.fromWorkspace(e, this)]
            )),
            newWorkspace.authorizations.topLevelIds,
            new Map(Object.entries(newWorkspace.authorizations.childIds)),
        )

        this.certificates = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.certificates.entities).map((e) =>
                [e.id, EditableCertificate.fromWorkspace(e, this)]
            )),
            newWorkspace.certificates.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.certificates.childIds)),
        )

        this.proxies = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.proxies.entities).map((e) =>
                [e.id, EditableProxy.fromWorkspace(e, this)]
            )),
            newWorkspace.proxies.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.proxies.childIds)),
        )

        this.warnings.set(newWorkspace.warnings)
        this.defaults = EditableDefaults.fromWorkspace(newWorkspace.defaults, this)

        this.executions.clear()
        this.invalidItems.clear()
        this.clearAllActive()
        this.pendingPkceRequests.clear()

        // Create a request but mark it as unchanged and valid so that the user can open a workbook without getting nagged
        const request = new EditableRequest({
            id: GenerateIdentifier(),
            name: 'New Request',
            url: '',
            multiRunExecution: GroupExecution.Sequential,
            runs: 1,
            test: `describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})`}, this)
        request.dirty = false
        this.setExpandedItems(['hdr-r'])
        this.requests.add(request, false, null)
        for (const session of this.sessions.values()) {
            session.clearAllEditSessions()
        }
        this.dirty = false
        this.changeActive(EditableEntityType.Request, request.id)
    }

    @action
    loadWorkspace(newWorkspace: Workspace, fileName: string, displayName: string) {
        const expandedItems = ['hdr-r']

        if (newWorkspace.requests.childIds) {
            for (const groupId of Object.keys(newWorkspace.requests.childIds)) {
                expandedItems.push(`g-${groupId}`)
            }
        }
        this.setExpandedItems(expandedItems)

        this.requests = new IndexedEntityManager(
            new Map(Object.entries(newWorkspace.requests.entities).map(([id, e]) =>
                [id,
                    (e as unknown as Request)['url'] === undefined
                        ? EditableRequestGroup.fromWorkspace(e as RequestGroup, this)
                        : EditableRequest.fromWorkspace(e as Request, this)
                ]
            )),
            newWorkspace.requests.topLevelIds,
            new Map(Object.entries(newWorkspace.requests.childIds)),
        )
        this.scenarios = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.scenarios.entities).map((e) =>
                [e.id, EditableScenario.fromWorkspace(e, this)]
            )),
            newWorkspace.scenarios.topLevelIds,
            new Map(Object.entries(newWorkspace.scenarios.childIds)),
        )

        this.authorizations = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.authorizations.entities).map((e) =>
                [e.id, EditableAuthorization.fromWorkspace(e, this)]
            )),
            newWorkspace.authorizations.topLevelIds,
            new Map(Object.entries(newWorkspace.authorizations.childIds)),
        )

        this.certificates = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.certificates.entities).map((e) =>
                [e.id, EditableCertificate.fromWorkspace(e, this)]
            )),
            newWorkspace.certificates.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.certificates.childIds)),
        )

        this.proxies = new IndexedEntityManager(
            new Map(Object.values(newWorkspace.proxies.entities).map((e) =>
                [e.id, EditableProxy.fromWorkspace(e, this)]
            )),
            newWorkspace.proxies.topLevelIds ?? [],
            new Map(Object.entries(newWorkspace.proxies.childIds)),
        )

        this.defaults = EditableDefaults.fromWorkspace(newWorkspace.defaults, this)

        this.externalData =
            new IndexedEntityManager(
                new Map(Object.values(newWorkspace.data.entities).map((e) =>
                    [e.id, EditableExternalDataEntry.fromWorkspace(e, this)]
                )),
                newWorkspace.data.topLevelIds ?? [],
                new Map(Object.entries(newWorkspace.data.childIds)),
            )

        this.warnings.set(newWorkspace.warnings)

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
        this.setMode(this.warnings.hasEntries ? WorkspaceMode.Warnings : WorkspaceMode.Normal)
        this.workbookFullName = fileName
        this.workbookDisplayName = displayName

        this.clearAllActive()
        for (const session of this.sessions.values()) {
            session.clearAllEditSessions()
        }

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
            this.externalData,
            this.defaults,
        )
    }


    @action
    setExpandedItems(expandedItems: string[], sessionId?: string) {
        for (const [id, session] of this.sessions) {
            if ((!sessionId) || (id === sessionId)) {
                session.expandedItems = expandedItems
            }
        }
    }

    @action
    setMode(mode: WorkspaceMode, sessionId?: string) {
        for (const [id, session] of this.sessions) {
            if ((!sessionId) || (id === sessionId)) {
                session.mode = mode
            }
        }
    }

    @action
    changeActive(type: EditableEntityType, id: string, sessionId?: string) {
        for (const [nid, session] of this.sessions) {
            if ((!sessionId) || (nid === sessionId)) {
                session.changeActive(type, id)
            }
        }
    }

    @action
    clearAllActive(sessionId?: string) {
        for (const [nid, session] of this.sessions) {
            if ((!sessionId) || (nid === sessionId)) {
                session.clearAllActive()
            }
        }
    }

    @action
    clearActive(type: EditableEntityType, id: string, sessionId?: string) {
        for (const [nid, navigation] of this.sessions) {
            if ((!sessionId) || (nid === sessionId)) {
                navigation.clearActive(type, id)
            }
        }
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
    addRequest(sessionId: string, targetID?: string | null) {
        const entry = new EditableRequest({
            id: GenerateIdentifier(),
            runs: 1,
            url: '',
            multiRunExecution: GroupExecution.Sequential,
            test: `describe('status', () => {
                it('equals 200', () => {
                    expect(response.status).to.equal(200)
                })
            })`
        }, this)
        this.requests.add(entry, false, targetID)
        this.dirty = true
        this.changeActive(EditableEntityType.Request, entry.id, sessionId)
    }

    @action
    deleteRequest(id: string) {
        this.clearActive(EditableEntityType.Request, id)
        this.requests.remove(id)
        this.executions.delete(id)
        this.dirty = true
    }

    @action
    moveRequest(sessionId: string, requestId: string, destinationRequestId: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.requests.move(requestId, destinationRequestId, onLowerHalf, onLeft)
        this.dirty = true
        this.changeActive(EditableEntityType.Request, requestId, sessionId)

        // If drop is on a folder, then expand it
        if (destinationRequestId && this.requests.childIds.has(destinationRequestId)) {
            const destination = this.requests.entities.get(destinationRequestId)
            if (destination) {
                this.sessions.get(sessionId)?.updateExpanded(
                    `${destination.entityType}-${destinationRequestId}`, true
                )
            }
        }
    }

    @action
    copyRequest(sessionId: string, requestId: string) {
        const newChildren = new Map<string, string[]>()

        const copySeletion = (selection?: Selection) => {
            return selection
                ? { id: selection.id, name: selection.name } as Selection
                : undefined
        }

        const copyEntry = (entry: EditableRequest | EditableRequestGroup, appendCopySuffix: boolean) => {
            switch (entry.entityType) {
                case EditableEntityType.Request:
                    const request = new EditableRequest({
                        id: GenerateIdentifier(),
                        name: `${GetTitle(entry)}${appendCopySuffix ? ' - copy' : ''}`,
                        runs: entry.runs,
                        multiRunExecution: GroupExecution.Sequential,
                        url: entry.url,
                        method: entry.method,
                        mode: entry.mode,
                        timeout: entry.timeout,
                        headers: entry.headers.map(h => ({ ...h, id: GenerateIdentifier() } as EditableNameValuePair)),
                        queryStringParams: entry.queryStringParams.map(q => ({ ...q, id: GenerateIdentifier() } as EditableNameValuePair)),
                        body: entry.body
                            ? structuredClone(toJS(entry.body))
                            : { type: BodyType.None, data: undefined },
                        test: entry.test,
                        selectedScenario: copySeletion(entry.selectedScenario),
                        selectedAuthorization: copySeletion(entry.selectedAuthorization),
                        selectedCertificate: copySeletion(entry.selectedCertificate),
                        selectedProxy: copySeletion(entry.selectedProxy),
                    }, this)
                    request.dirty = true
                    this.requests.set(request.id, request)
                    return request
                case EditableEntityType.Group:
                    const group = new EditableRequestGroup({
                        id: GenerateIdentifier(),
                        name: `${GetTitle(entry)}${appendCopySuffix ? ' - copy' : ''}`,
                        runs: entry.runs,
                        multiRunExecution: entry.multiRunExecution,
                        execution: entry.execution,
                        selectedScenario: copySeletion(entry.selectedScenario),
                        selectedAuthorization: copySeletion(entry.selectedAuthorization),
                        selectedCertificate: copySeletion(entry.selectedCertificate),
                        selectedProxy: copySeletion(entry.selectedProxy),
                    }, this)
                    group.dirty = true

                    this.requests.set(group.id, group)

                    const sourceChildIDs = this.requests.childIds.get(entry.id)
                    if (sourceChildIDs && sourceChildIDs.length > 0) {
                        const dupedChildIDs: string[] = []
                        sourceChildIDs.forEach(childID => {
                            const childEntry = this.requests.get(childID)
                            if (childEntry) {
                                dupedChildIDs.push(copyEntry(childEntry, false).id)
                            }
                        })
                        // Apparently, updating this.requests.childIds here confuses mobx
                        newChildren.set(group.id, dupedChildIDs)
                    }
                    return group
            }
        }

        const source = this.requests.get(requestId)
        const copiedEntry = copyEntry(source, true)

        const parent = this.requests.findParent(requestId)
        this.requests.add(copiedEntry, source.entityType === EditableEntityType.Group, parent?.id)

        // Set child IDs
        for (const [copiedId, copiedChildIds] of newChildren) {
            this.requests.childIds.set(copiedId, copiedChildIds)
        }

        this.dirty = true
        this.changeActive(copiedEntry.entityType, copiedEntry.id, sessionId)

        if (copiedEntry.entityType === EditableEntityType.Group) {
            this.sessions.get(sessionId)?.updateExpanded(
                `${copiedEntry.entityType}-${copiedEntry.id}`, true
            )
        }
    }

    @action
    deleteWorkspaceWarning(sessionId: string, warningId: string) {
        this.warnings.delete(warningId)
        if (!this.warnings.hasEntries) {
            this.clearAllActive(sessionId)
        }
    }

    @action
    deleteRequestWarning(requestEntry: EditableRequestEntry, warningId: string) {
        if (requestEntry.warnings) {
            requestEntry.warnings.delete(warningId)
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
    getActiveParameters(requestEntry: EditableRequestEntry): {
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
        let e = this.requests.findParent(requestEntry.id)
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

        return {
            scenario,
            authorization,
            certificate,
            proxy,
            data
        }

    }

    getRequestParameterLists(requestEntry: EditableRequestEntry) {
        const active = this.getActiveParameters(requestEntry)

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
            data: this.buildParameterList(this.externalData, defaultData),
        }
    }

    getDefaultParameterLists() {
        return {
            scenarios: this.buildParameterList(this.scenarios),
            authorizations: this.buildParameterList(this.authorizations),
            certificates: this.buildParameterList(this.certificates),
            proxies: this.buildParameterList(this.proxies),
            data: this.buildParameterList(this.externalData)
        }
    }

    /**
     * Updates editor session values, excluding the active session (because it's already updated there)
     * @param requestOrGroupId 
     * @param type 
     * @param value 
     * @param activeSssionId 
     */
    updateEditorSessionText(requestOrGroupId: string, type: RequestEditSessionType, value: string, activeSssionId: string) {
        for (const [id, session] of this.sessions) {
            if (id !== activeSssionId) {
                const editSession = session.getRequestEditSession(requestOrGroupId, type)
                if (editSession) {
                    editSession.setValue(value)
                }
            }
        }
    }

    @action
    addGroup(targetID?: string | null) {
        const entry = new EditableRequestGroup({
            id: GenerateIdentifier(),
            runs: 1,
            execution: GroupExecution.Sequential,
            multiRunExecution: GroupExecution.Sequential,
        }, this)
        this.requests.add(entry, true, targetID)
        this.dirty = true
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    @action
    deleteGroup(id: string) {
        this.deleteRequest(id)
    }

    @action
    moveGroup(sessionId: string, id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.moveRequest(sessionId, id, destinationID, onLeft, onLowerHalf)
    }

    @action
    copyGroup(sessionId: string, id: string) {
        this.copyRequest(sessionId, id)
    }

    @action
    addScenario(persistence: Persistence, targetID?: string | null) {
        const scenario = new EditableScenario({
            id: GenerateIdentifier()
        }, this)
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
        this.clearActive(EditableEntityType.Scenario, id)
        this.dirty = true
    }

    @action
    moveScenario(sessionId: string, id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) {
        this.scenarios.move(id, destinationID, onLowerHalf, isSection)
        this.changeActive(EditableEntityType.Scenario, id, sessionId)
        this.dirty = true
        // if (selectedScenario !== NO_SELECTION) {
        //     activateScenario(id)
        // }
    }

    @action
    copyScenario(id: string) {
        const source = this.scenarios.get(id)
        if (!source) return
        const scenario = new EditableScenario({
            id: GenerateIdentifier(),
            name: `${GetTitle(source)} - Copy`,
            variables: source.variables.map(v => new EditableVariable(
                GenerateIdentifier(),
                v.name,
                v.type,
                v.value,
                v.disabled
            ))
        }, this)
        scenario.dirty = true
        this.scenarios.add(scenario, false, id)
        this.dirty = true
        this.changeActive(EditableEntityType.Scenario, scenario.id)
    }

    @action
    addAuthorization(persistence: Persistence, targetID?: string | null) {
        const authorization = new EditableAuthorization({
            id: GenerateIdentifier(),
            type: AuthorizationType.ApiKey,
            header: 'x-api--key',
            value: ''
        }, this)
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
        this.clearActive(EditableEntityType.Authorization, id)
        this.dirty = true
    }

    @action
    moveAuthorization(sessionId: string, id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.authorizations.move(id, destinationID, onLowerHalf, onLeft)
        this.changeActive(EditableEntityType.Authorization, id, sessionId)
        this.dirty = true
        // if (selectedAuthorizationId !== id) {
        //     activateAuthorization(id)
        // }
    }

    @action
    copyAuthorization(id: string) {
        const source = this.authorizations.get(id)
        if (!source) return
        const authorization = new EditableAuthorization({
            id: GenerateIdentifier(),
            name: `${GetTitle(source)} - Copy`,
            type: source.type,
            header: source.header,
            value: source.value,
            username: source.username,
            password: source.password,
            accessTokenUrl: source.accessTokenUrl,
            authorizeUrl: source.authorizeUrl,
            clientId: source.clientId,
            clientSecret: source.clientSecret,
            scope: source.scope,
            audience: source.audience,
            selectedCertificate: source.selectedCertificate,
            selectedProxy: source.selectedProxy,
        }, this)
        authorization.dirty = true

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
    addCertificate(persistence: Persistence, targetID?: string | null) {
        const certificate = new EditableCertificate({
            id: GenerateIdentifier(),
            type: CertificateType.PEM,
            pem: ''
        }, this)
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
        this.clearActive(EditableEntityType.Certificate, id)
        this.dirty = true
    }

    @action
    moveCertificate(sessionId: string, id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.certificates.move(id, destinationID, onLowerHalf, onLeft)
        this.changeActive(EditableEntityType.Certificate, id, sessionId)
        this.dirty = true
    }

    @action
    copyCertificate(id: string) {
        const source = this.certificates.get(id)
        if (!source) return
        const certificate = new EditableCertificate({
            id: GenerateIdentifier(),
            name: `${GetTitle(source)} - Copy`,
            type: source.type,
            pem: source.pem,
            key: source.key,
            pfx: source.pfx,
            password: source.password,
        }, this)
        certificate.dirty = true

        this.certificates.add(certificate, false, id)
        this.dirty = true
        this.changeActive(EditableEntityType.Certificate, certificate.id)
    }

    @action
    addProxy(persistence: Persistence, targetID?: string | null) {
        const proxy = new EditableProxy({
            id: GenerateIdentifier(),
            url: ''
        }, this)
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
        this.clearActive(EditableEntityType.Proxy, id)
        this.dirty = true
    }

    @action
    moveProxy(sessionId: string, id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        this.proxies.move(id, destinationID, onLowerHalf, onLeft)
        this.changeActive(EditableEntityType.Proxy, id, sessionId)
        this.dirty = true
        // if (selectedProxyId !== id) {
        //     activateProxy(id)
        // }
    }

    @action
    copyProxy(id: string) {
        const source = this.proxies.get(id)
        if (source) {
            const proxy = new EditableProxy({
                id: GenerateIdentifier(),
                name: `${GetTitle(source)} - Copy`,
                url: source.url,
            }, this)
            proxy.dirty = true
            this.proxies.add(proxy, false, id)
            this.dirty = true
            this.changeActive(EditableEntityType.Proxy, proxy.id)
        }
    }

    @action
    addData() {
        const data = new EditableExternalDataEntry({
            id: GenerateIdentifier(),
            name: '',
            type: ExternalDataSourceType.JSON,
            source: '{}'
        }, this)
        this.externalData.add(data, false, Persistence.Workbook)
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
        this.externalData.remove(id)
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

                variables: result.inputVariables ? result.inputVariables : undefined,
                outputVariables: result.outputVariables ? result.outputVariables : undefined,

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
        this.lastExecution = { requestOrGroupId: execution.requestOrGroupId }
        
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
                    requestOrGroupId: group.id,
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
                                requestOrGroupId: group.id,
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
                    requestOrGroupId: request.id,
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
                                    requestOrGroupId: request.id,
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
                requestOrGroupId: request.id,
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
                            requestOrGroupId: request.id,
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
                    r.timeout = 0
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
                    (r as Request).timeout = Number.MAX_SAFE_INTEGER
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
    changeResultsPanel(requestOrGroupId: string, panel: ResultsPanel) {
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

    @computed get defaultsState() {
        return (this.externalData.values.find(v => v.state === EditableState.Warning) !== undefined)
            ? EditableState.Warning
            : EditableState.None
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
