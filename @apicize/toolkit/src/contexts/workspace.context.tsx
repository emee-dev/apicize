import { action, makeObservable, observable, toJS } from "mobx"
import { DEFAULT_SELECTION_ID, NO_SELECTION, NO_SELECTION_ID } from "../models/store"
import { WorkbookExecution, WorkbookExecutionGroup, WorkbookExecutionMenuItem, WorkbookExecutionRequest, WorkbookExecutionResult } from "../models/workbook/workbook-execution"
import { base64Decode, base64Encode, editableWorkspaceToStoredWorkspace, newEditableWorkspace, storedWorkspaceToEditableWorkspace } from "../services/apicize-serializer"
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from "../models/workbook/editable-workbook-request"
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario"
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization"
import { EditableWorkbookCertificate } from "../models/workbook/editable-workbook-certificate"
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy"
import {
    Identifiable, Named, IndexedEntities, GetTitle, Persistence, addNestedEntity, removeNestedEntity, moveNestedEntity, getNestedEntity, WorkbookGroupExecution,
    addEntity, removeEntity, moveEntity, WorkbookBodyType, WorkbookMethod, WorkbookBodyData, WorkbookAuthorizationType,
    WorkbookCertificateType, findParentEntity, Workspace,
    ApicizeExecution,
    ApicizeExecutionGroup,
    ApicizeExecutionItem,
    ApicizeExecutionRequest,
    WorkbookBody,
    ApicizeExecutionDetails,
} from "@apicize/lib-typescript"
import { EntitySelection } from "../models/workbook/entity-selection"
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { EditableEntityType } from "../models/workbook/editable-entity-type"
import { EditableItem } from "../models/editable"
import { createContext, useContext } from "react"
import { EditableWorkbookDefaults } from "../models/workbook/editable-workbook-defaults"

export class WorkspaceStore {
    /**
     * Workspace representing all requests, scenarios, authorizations, certificates and proxies
     */
    @observable accessor workspace = newEditableWorkspace()

    /**
     * Apicize executions underway or completed
     */
    @observable accessor executions = new Map<string, WorkbookExecution>()

    @observable accessor active: EditableItem | null = null

    @observable accessor helpVisible = false
    @observable accessor helpTopic = ''
    @observable accessor nextHelpTopic = ''
    @observable accessor helpHistory: string[] = []

    @observable accessor appName = 'Apicize'
    @observable accessor appVersion = ''
    @observable accessor workbookFullName = ''
    @observable accessor workbookDisplayName = '(New Workbook)'
    @observable accessor dirty: boolean = false
    @observable accessor warnOnWorkspaceCreds: boolean = true
    @observable accessor invalidItems = new Set<string>()

    @observable accessor executingRequestIDs: string[] = []

    @observable accessor expandedItems = ['hdr-r', 'hdr-s', 'hdr-a', 'hdr-c', 'hdr-p']

    constructor(private readonly callbacks: {
        onExecuteRequest: (workspace: Workspace, requestId: string, runs?: number) => Promise<ApicizeExecution>,
        onCancelRequest: (requestId: string) => Promise<void>,
        onClearToken: (authorizationId: string) => Promise<void>,
    }) {
        makeObservable(this)
    }

    anyInvalid() {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.invalid) { console.log('invalid', { type: entity.entityType, id: entity.id }); return true; }
        }
        for (const entity of this.workspace.scenarios.entities.values()) {
            if (entity.invalid) { console.log('invalid', { type: entity.entityType, id: entity.id }); return true; }
        }
        for (const entity of this.workspace.authorizations.entities.values()) {
            if (entity.invalid) { console.log('invalid', { type: entity.entityType, id: entity.id }); return true; }
        }
        for (const entity of this.workspace.certificates.entities.values()) {
            if (entity.invalid) { console.log('invalid', { type: entity.entityType, id: entity.id }); return true; }
        }
        for (const entity of this.workspace.proxies.entities.values()) {
            if (entity.invalid) { console.log('invalid', { type: entity.entityType, id: entity.id }); return true; }
        }
        return false
    }

    @action
    showHelp(topic: string) {
        const historyLength = this.helpHistory.length
        if (historyLength >= 25) {
            if (this.helpHistory[historyLength - 1] !== topic) {
                this.helpHistory = [...this.helpHistory.slice(1), topic]
            }
        } if ((historyLength === 0 || this.helpHistory[historyLength - 1] !== topic)) {
            this.helpHistory.push(topic)
        }
        this.helpTopic = topic
        this.helpVisible = true
    }

    @action
    showNextHelpTopic() {
        this.showHelp((this.nextHelpTopic.length > 0) ? this.nextHelpTopic : 'home')
    }

    @action
    hideHelp() {
        this.helpVisible = false
    }

    @action
    backHelp() {
        if (this.helpHistory.length > 1) {
            this.helpHistory.pop()
            const lastTopic = this.helpHistory.pop()
            if (lastTopic) {
                this.helpTopic = lastTopic
                this.helpVisible = true
            }
        }
    }

    @action
    changeApp(name: string, version: string) {
        this.appName = name
        this.appVersion = version
    }

    @action
    newWorkspace() {
        this.workbookFullName = ''
        this.workbookDisplayName = ''
        this.dirty = false
        this.warnOnWorkspaceCreds = true
        this.workspace = newEditableWorkspace()
        this.expandedItems = ['hdr-r', 'hdr-s', 'hdr-a', 'hdr-c', 'hdr-p']
        this.executions.clear()
        this.invalidItems.clear()
        this.active = null
    }

    @action
    loadWorkspace(newWorkspace: Workspace, fileName: string, displayName: string) {
        this.workspace = storedWorkspaceToEditableWorkspace(newWorkspace)
        const expandedItems = ['hdr-r', 'hdr-s', 'hdr-a', 'hdr-c', 'hdr-p']
        if (this.workspace.requests.childIds) {
            for (const groupId of this.workspace.requests.childIds.keys()) {
                expandedItems.push(`g-${groupId}`)
            }
        }
        this.expandedItems = expandedItems

        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.invalid) this.invalidItems.add(entity.id)
        }
        for (const entity of this.workspace.scenarios.entities.values()) {
            if (entity.invalid) this.invalidItems.add(entity.id)
        }
        for (const entity of this.workspace.authorizations.entities.values()) {
            if (entity.invalid) this.invalidItems.add(entity.id)
        }
        for (const entity of this.workspace.certificates.entities.values()) {
            if (entity.invalid) this.invalidItems.add(entity.id)
        }
        for (const entity of this.workspace.proxies.entities.values()) {
            if (entity.invalid) this.invalidItems.add(entity.id)
        }
        this.active = null
        this.workbookFullName = fileName
        this.workbookDisplayName = displayName
        this.dirty = false
        this.warnOnWorkspaceCreds = true
        this.executions.clear()
        this.invalidItems.clear()
    }

    @action
    updateSavedLocation(fileName: string, displayName: string) {
        this.workbookFullName = fileName
        this.workbookDisplayName = displayName
        this.dirty = false
    }

    getWorkspace() {
        return editableWorkspaceToStoredWorkspace(
            this.workspace.requests,
            this.workspace.scenarios,
            this.workspace.authorizations,
            this.workspace.certificates,
            this.workspace.proxies,
            this.workspace.defaults,
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
        switch (type) {
            case EditableEntityType.Request:
            case EditableEntityType.Group:
                this.hideHelp()
                const r = this.workspace.requests.entities.get(id)
                if (!r) throw new Error(`Invalid request ID ${id}`)
                this.active = r
                this.nextHelpTopic = r.entityType === EditableEntityType.Group ? 'groups' : 'requests'
                break
            case EditableEntityType.Scenario:
                this.hideHelp()
                const s = this.workspace.scenarios.entities.get(id)
                if (!s) throw new Error(`Invalid scenario ID ${id}`)
                this.active = s
                this.nextHelpTopic = 'scenarios'
                break
            case EditableEntityType.Authorization:
                this.hideHelp()
                const a = this.workspace.authorizations.entities.get(id)
                if (!a) throw new Error(`Invalid authorization ID ${id}`)
                this.active = a
                this.nextHelpTopic = 'authorizations'
                break
            case EditableEntityType.Certificate:
                this.hideHelp()
                const c = this.workspace.certificates.entities.get(id)
                if (!c) throw new Error(`Invalid certificate ID ${id}`)
                this.active = c
                this.nextHelpTopic = 'certificates'
                break
            case EditableEntityType.Proxy:
                this.hideHelp()
                const p = this.workspace.proxies.entities.get(id)
                if (!p) throw new Error(`Invalid proxy ID ${id}`)
                this.active = p
                this.nextHelpTopic = 'proxies'
                break
            case EditableEntityType.Defaults:
                this.hideHelp()
                this.active = this.workspace.defaults
                this.nextHelpTopic = 'settings'
                break
            default:
                this.active = null
                this.hideHelp()
                break
        }
    }

    @action
    clearActive() {
        this.active = null
    }

    /***
     * Return list of authorizations and/or certificates that are stored directly
     * in the workspace
     */
    public listWorkspaceCredentials() {
        let publics = []
        for (const auth of this.workspace.authorizations.entities.values()) {
            if (auth.persistence === Persistence.Workbook) {
                publics.push(auth)
            }
        }
        for (const cert of this.workspace.certificates.entities.values()) {
            if (cert.persistence === Persistence.Workbook) {
                publics.push(cert)
            }
        }
        return publics
    }

    /**
     * Generate a list of entities, including default and none selections, returns list and selected ID
     * @param entityList 
     * @param activeId 
     * @returns tuple of list and selected ID
     */
    private buildEntityList = <T extends Identifiable & Named>(
        entityList: IndexedEntities<T>,
        defaultName?: string): EntitySelection[] => {
        const list: EntitySelection[] = []
        if (defaultName !== undefined) {
            list.push({ id: DEFAULT_SELECTION_ID, name: `Default (${defaultName})` })
        }
        list.push({ id: NO_SELECTION_ID, name: `Off` })
        for (const id of entityList.topLevelIds) {
            const e = entityList.entities.get(id)
            if (e) {
                list.push({ id: e.id, name: GetTitle(e) })
            }
        }
        return list
    }


    @action
    addRequest(targetID?: string | null) {
        const entry = new EditableWorkbookRequest()
        entry.id = GenerateIdentifier()
        entry.runs = 1
        entry.test = `describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})`
        addNestedEntity(entry, this.workspace.requests, false, targetID)
        this.dirty = true
        this.changeActive(EditableEntityType.Request, entry.id)
    }

    @action
    deleteRequest(id: string) {
        if (this.active?.id === id) {
            this.clearActive()
        }
        removeNestedEntity(id, this.workspace.requests)
        this.executions.delete(id)
        this.dirty = true
    }

    @action
    moveRequest(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveNestedEntity(id, destinationID, onLowerHalf, onLeft, this.workspace.requests)
        this.dirty = true
        if (this.active?.id !== id) {
            this.changeActive(EditableEntityType.Request, id)
        }
    }

    @action
    copyRequest(id: string) {
        // Return the ID of the duplicated entry
        const copyEntry = (entry: EditableWorkbookRequest | EditableWorkbookRequestGroup, appendCopySuffix: boolean) => {
            if (entry.entityType === EditableEntityType.Request) {
                const request = new EditableWorkbookRequest()
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
                    : { type: WorkbookBodyType.None, data: undefined }
                request.test = entry.test
                this.workspace.requests.entities.set(request.id, request)
                return request
            }

            const group = new EditableWorkbookRequestGroup()
            group.id = GenerateIdentifier()
            group.name = `${GetTitle(entry)}${appendCopySuffix ? ' - copy' : ''}`
            group.runs = entry.runs
            group.dirty = true
            group.execution = entry.execution
            this.workspace.requests.entities.set(group.id, group)

            if (this.workspace.requests.childIds) {
                const sourceChildIDs = this.workspace.requests.childIds?.get(source.id)
                if (sourceChildIDs && sourceChildIDs.length > 0) {
                    const dupedChildIDs: string[] = []
                    sourceChildIDs.forEach(childID => {
                        const childEntry = this.workspace.requests.entities.get(childID)
                        if (childEntry) {
                            const dupedChildID = copyEntry(childEntry, false).id
                            dupedChildIDs.push(dupedChildID)
                        }
                    })
                    this.workspace.requests.childIds.set(group.id, dupedChildIDs)
                }
            }
            return group
        }

        const source = getNestedEntity(id, this.workspace.requests)
        const copiedEntry = copyEntry(source, true)
        this.workspace.requests.entities.set(copiedEntry.id, copiedEntry)

        let append = true
        if (this.workspace.requests.childIds) {
            for (const childIDs of this.workspace.requests.childIds.values()) {
                let idxChild = childIDs.indexOf(id)
                if (idxChild !== -1) {
                    childIDs.splice(idxChild + 1, 0, copiedEntry.id)
                    append = false
                    break
                }
            }
        }

        if (append) {
            const idx = this.workspace.requests.topLevelIds.indexOf(id)
            if (idx !== -1) {
                this.workspace.requests.topLevelIds.splice(idx + 1, 0, copiedEntry.id)
                append = false
            }
        }

        if (append) {
            this.workspace.requests.topLevelIds.push(copiedEntry.id)
        }

        this.dirty = true
        this.changeActive(EditableEntityType.Request, copiedEntry.id)
    }

    @action
    deleteWorkspaceWarning(warningId: string) {
        this.workspace.defaults.warnings?.delete(warningId)
    }

    getRequest(id: string) {
        return this.workspace.requests.entities.get(id)
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
            const request = this.active as EditableWorkbookRequest
            request.url = value
            this.dirty = true
        }
    }

    @action
    setRequestMethod(value: WorkbookMethod) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.method = value
            this.dirty = true
        }
    }

    @action
    setRequestTimeout(value: number) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.timeout = value
            this.dirty = true
        }
    }

    @action
    setRequestQueryStringParams(value: EditableNameValuePair[] | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.queryStringParams = value ?? []
            this.dirty = true
        }
    }

    @action
    setRequestHeaders(value: EditableNameValuePair[] | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.headers = value ?? []
            this.dirty = true
        }
    }

    @action
    setRequestBodyType(value: WorkbookBodyType | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            let newBody: WorkbookBody
            if (request.body && request.body.data) {
                switch (value) {
                    case WorkbookBodyType.Raw:
                        switch (request.body.type) {
                            case WorkbookBodyType.Form:
                                newBody = {
                                    type: WorkbookBodyType.Raw, data: base64Encode((new TextEncoder()).encode(
                                        encodeFormData(request.body.data as EditableNameValuePair[])
                                    ))
                                }
                                break
                            case WorkbookBodyType.XML:
                            case WorkbookBodyType.JSON:
                            case WorkbookBodyType.Text:
                                newBody = { type: WorkbookBodyType.Raw, data: base64Encode((new TextEncoder()).encode(request.body.data)) }
                                break
                            case WorkbookBodyType.Raw:
                                newBody = { type: WorkbookBodyType.Raw, data: request.body.data }
                                break
                            default:
                                newBody = {
                                    type: WorkbookBodyType.Raw, data: ''
                                }
                        }
                        break
                    case WorkbookBodyType.Form:
                        switch (request.body.type) {
                            case WorkbookBodyType.JSON:
                            case WorkbookBodyType.XML:
                            case WorkbookBodyType.Text:
                            case WorkbookBodyType.Raw:
                                newBody = {
                                    type: WorkbookBodyType.Form,
                                    data: decodeFormData(request.body.data)
                                }
                                break
                            case WorkbookBodyType.Form:
                                newBody = { type: WorkbookBodyType.Form, data: request.body.data }
                                break
                            default:
                                newBody = {
                                    type: WorkbookBodyType.Form, data: []
                                }
                                break
                        }
                        break
                    case WorkbookBodyType.JSON:
                    case WorkbookBodyType.XML:
                    case WorkbookBodyType.Text:
                        switch (request.body.type) {
                            case WorkbookBodyType.JSON:
                            case WorkbookBodyType.XML:
                            case WorkbookBodyType.Text:
                                newBody = { type: value, data: request.body.data }
                                break
                            case WorkbookBodyType.Raw:
                                newBody = { type: value, data: (new TextDecoder()).decode(base64Decode(request.body.data)) }
                                break
                            default:
                                newBody = { type: WorkbookBodyType.None, data: undefined }
                                break
                        }
                        break
                    case WorkbookBodyType.None:
                    default:
                        newBody = {
                            type: WorkbookBodyType.None,
                            data: undefined
                        }

                }
            } else {
                switch (value) {
                    case WorkbookBodyType.Form:
                        newBody = {
                            type: WorkbookBodyType.Form,
                            data: []
                        }
                        break
                    case WorkbookBodyType.XML:
                    case WorkbookBodyType.JSON:
                    case WorkbookBodyType.Text:
                        newBody = {
                            type: value,
                            data: ''
                        }
                        break
                    case WorkbookBodyType.None:
                    default:
                        newBody = {
                            type: WorkbookBodyType.None,
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
    setRequestBody(body: WorkbookBody) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.body = body
            this.dirty = true
        }
    }

    @action
    setRequestBodyData(value: string | EditableNameValuePair[]) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.body.data = value
            this.dirty = true
        }
    }

    @action
    setRequestRuns(value: number) {
        switch (this.active?.entityType) {
            case EditableEntityType.Request:
                const request = this.active as EditableWorkbookRequest
                request.runs = value
                this.dirty = true
                break
            case EditableEntityType.Group:
                const group = this.active as EditableWorkbookRequestGroup
                group.runs = value
                this.dirty = true
                break
        }
    }

    @action
    setRequestTest(value: string | undefined) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.test = value ?? ''
            this.dirty = true
        }
    }

    @action
    setRequestSelectedScenarioId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableWorkbookRequest
            request.selectedScenario = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.scenarios.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setRequestSelectedAuthorizationId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableWorkbookRequest
            request.selectedAuthorization = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.authorizations.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setRequestSelectedCertificateId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableWorkbookRequest
            request.selectedCertificate = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.certificates.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setRequestSelectedProxyId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableWorkbookRequest
            request.selectedProxy = entityId === DEFAULT_SELECTION_ID
                ? undefined
                : entityId == NO_SELECTION_ID
                    ? NO_SELECTION
                    : { id: entityId, name: GetTitle(this.workspace.proxies.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    deleteRequestWarning(warningId: string) {
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableWorkbookRequest
            if (request.warnings) {
                request.warnings.delete(warningId)
            }
        }
    }

    getRequestParameterLists() {
        let activeScenarioId = DEFAULT_SELECTION_ID
        let activeAuthorizationId = DEFAULT_SELECTION_ID
        let activeCertificateId = DEFAULT_SELECTION_ID
        let activeProxyId = DEFAULT_SELECTION_ID

        // Determine the active credentials by working our way up the hierarchy
        if (this.active?.entityType === EditableEntityType.Request || this.active?.entityType === EditableEntityType.Group) {
            const request = this.active as EditableWorkbookRequest
            let e = findParentEntity(request.id, this.workspace.requests)
            while (e) {
                let r = e as (EditableWorkbookRequest & EditableWorkbookRequest)
                if (activeScenarioId === DEFAULT_SELECTION_ID && r.selectedScenario) {
                    activeScenarioId = r.selectedScenario.id
                }
                if (activeAuthorizationId === DEFAULT_SELECTION_ID && r.selectedAuthorization) {
                    activeAuthorizationId = r.selectedAuthorization.id
                }
                if (activeCertificateId === DEFAULT_SELECTION_ID && r.selectedCertificate) {
                    activeCertificateId = r.selectedCertificate.id
                }
                if (activeProxyId === DEFAULT_SELECTION_ID && r.selectedProxy) {
                    activeProxyId = r.selectedProxy.id
                }

                if (activeScenarioId !== DEFAULT_SELECTION_ID
                    && activeAuthorizationId !== DEFAULT_SELECTION_ID
                    && activeCertificateId !== DEFAULT_SELECTION_ID
                    && activeProxyId !== DEFAULT_SELECTION_ID
                ) {
                    break
                }

                e = findParentEntity(e.id, this.workspace.requests)
            }
        }

        const defaultScenario = activeScenarioId == DEFAULT_SELECTION_ID
            ? this.workspace.defaults.selectedScenario.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.workspace.scenarios.entities.get(this.workspace.defaults.selectedScenario.id))
            : activeScenarioId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.scenarios.entities.get(activeScenarioId))

        const defaultAuthorization = activeAuthorizationId == DEFAULT_SELECTION_ID
            ? this.workspace.defaults.selectedAuthorization.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.workspace.authorizations.entities.get(this.workspace.defaults.selectedAuthorization.id))
            : activeAuthorizationId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.authorizations.entities.get(activeAuthorizationId))

        const defaultCertificate = activeCertificateId == DEFAULT_SELECTION_ID
            ? this.workspace.defaults.selectedCertificate.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.workspace.certificates.entities.get(this.workspace.defaults.selectedCertificate.id))
            : activeCertificateId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.certificates.entities.get(activeCertificateId))

        const defaultProxy = activeProxyId == DEFAULT_SELECTION_ID
            ? this.workspace.defaults.selectedProxy.id === NO_SELECTION_ID
                ? 'None Configured'
                : GetTitle(this.workspace.proxies.entities.get(this.workspace.defaults.selectedProxy.id))
            : activeProxyId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.proxies.entities.get(activeProxyId))

        return {
            scenarios: this.buildEntityList(this.workspace.scenarios, defaultScenario),
            authorizations: this.buildEntityList(this.workspace.authorizations, defaultAuthorization),
            certificates: this.buildEntityList(this.workspace.certificates, defaultCertificate),
            proxies: this.buildEntityList(this.workspace.proxies, defaultProxy),
        }
    }

    getDefaultParameterLists() {
        return {
            scenarios: this.buildEntityList(this.workspace.scenarios),
            authorizations: this.buildEntityList(this.workspace.authorizations),
            certificates: this.buildEntityList(this.workspace.certificates),
            proxies: this.buildEntityList(this.workspace.proxies),
        }
    }

    getStoredWorkspace() {
        return editableWorkspaceToStoredWorkspace(
            this.workspace.requests,
            this.workspace.scenarios,
            this.workspace.authorizations,
            this.workspace.certificates,
            this.workspace.proxies,
            this.workspace.defaults,
        )
    }


    @action
    addGroup(targetID?: string | null) {
        const entry = new EditableWorkbookRequestGroup()
        entry.id = GenerateIdentifier()
        entry.runs = 1
        addNestedEntity(entry, this.workspace.requests, true, targetID)
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
    setGroupExecution(value: WorkbookGroupExecution) {
        if (this.active?.entityType === EditableEntityType.Group) {
            const group = this.active as EditableWorkbookRequestGroup
            group.execution = value
            this.dirty = true
        }
    }

    @action
    setMultiRunExecution(value: WorkbookGroupExecution) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.multiRunExecution = value
            this.dirty = true
        } else if (this.active?.entityType === EditableEntityType.Group) {
            const group = this.active as EditableWorkbookRequestGroup
            group.multiRunExecution = value
            this.dirty = true
        }
    }

    @action
    addScenario(targetID?: string | null) {
        const scenario = new EditableWorkbookScenario()
        scenario.id = GenerateIdentifier()
        this.workspace.scenarios.entities.set(scenario.id, scenario)
        addEntity(scenario, this.workspace.scenarios, targetID)
        this.changeActive(EditableEntityType.Scenario, scenario.id)
        this.dirty = true
    }

    @action
    deleteScenario(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedScenario?.id === id) {
                entity.selectedScenario = undefined
            }
        }
        if (this.workspace.defaults.selectedScenario.id == id) {
            this.workspace.defaults.selectedScenario = NO_SELECTION
        }
        removeEntity(id, this.workspace.scenarios)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveScenario(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity<EditableWorkbookScenario>(id, destinationID, onLowerHalf, onLeft, this.workspace.scenarios)
        this.dirty = true
        // if (selectedScenario !== NO_SELECTION) {
        //     activateScenario(id)
        // }
    }

    @action
    copyScenario(id: string) {
        const source = this.workspace.scenarios.entities.get(id)
        if (!source) return
        const scenario = new EditableWorkbookScenario()
        scenario.id = GenerateIdentifier()
        scenario.name = `${GetTitle(source)} - Copy`
        scenario.dirty = true
        const idx = this.workspace.scenarios.topLevelIds.findIndex(eid => eid === id)
        if (idx === -1) {
            this.workspace.scenarios.topLevelIds.push(scenario.id)
        } else {
            this.workspace.scenarios.topLevelIds.splice(idx + 1, 0, scenario.id)
        }
        this.workspace.scenarios.entities.set(scenario.id, scenario)
        scenario.persistence = source.persistence
        scenario.variables = source.variables.map(v => ({
            id: GenerateIdentifier(),
            name: v.name,
            value: v.value,
            disabled: v.disabled
        }))
        this.dirty = true
        this.changeActive(EditableEntityType.Scenario, scenario.id)
    }

    getScenario(id: string) {
        return this.workspace.scenarios.entities.get(id)
    }

    @action
    setScenarioPersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Scenario) {
            const scenario = this.active as EditableWorkbookScenario
            scenario.persistence = value
        }
    }

    @action
    setScenarioVariables(value: EditableNameValuePair[] | undefined) {
        if (this.active?.entityType === EditableEntityType.Scenario) {
            const scenario = this.active as EditableWorkbookScenario
            scenario.variables = value || []
        }
    }

    @action
    addAuthorization(targetID?: string | null) {
        const authorization = new EditableWorkbookAuthorization()
        authorization.id = GenerateIdentifier()

        this.workspace.authorizations.entities.set(authorization.id, authorization)

        addEntity(authorization, this.workspace.authorizations, targetID)
        this.changeActive(EditableEntityType.Authorization, authorization.id)
        this.dirty = true
    }

    @action
    deleteAuthorization(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedAuthorization?.id === id) {
                entity.selectedAuthorization = undefined
            }
        }
        if (this.workspace.defaults.selectedAuthorization.id == id) {
            this.workspace.defaults.selectedAuthorization = NO_SELECTION
        }

        removeEntity(id, this.workspace.authorizations)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveAuthorization(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity<EditableWorkbookAuthorization>(id, destinationID, onLowerHalf, onLeft, this.workspace.authorizations)
        this.dirty = true
        // if (selectedAuthorizationId !== id) {
        //     activateAuthorization(id)
        // }
    }

    @action
    copyAuthorization(id: string) {
        const source = this.workspace.authorizations.entities.get(id)
        if (!source) return
        const authorization = new EditableWorkbookAuthorization()
        authorization.id = GenerateIdentifier()
        authorization.name = `${GetTitle(source)} - Copy`
        authorization.type = source.type
        authorization.dirty = true
        authorization.header = source.header
        authorization.value = source.value
        authorization.username = source.username
        authorization.password = source.password
        authorization.accessTokenUrl = source.accessTokenUrl
        authorization.clientId = source.clientId
        authorization.clientSecret = source.clientSecret
        authorization.scope = source.scope
        authorization.selectedCertificate = source.selectedCertificate
        authorization.selectedProxy = source.selectedProxy

        const idx = this.workspace.authorizations.topLevelIds.indexOf(source.id)
        if (idx === -1) {
            this.workspace.authorizations.topLevelIds.push(authorization.id)
        } else {
            this.workspace.authorizations.topLevelIds.splice(idx + 1, 0, authorization.id)
        }
        this.workspace.authorizations.entities.set(authorization.id, authorization)
        this.dirty = true
        this.changeActive(EditableEntityType.Authorization, authorization.id)
    }

    getAuthorization(id: string) {
        return this.workspace.authorizations.entities.get(id)
    }

    getAuthorizationCertificateList() {
        return this.buildEntityList(this.workspace.certificates)
    }

    getAuthorizationProxyList() {
        return this.buildEntityList(this.workspace.proxies)
    }

    @action
    setAuthorizationType(value: WorkbookAuthorizationType.ApiKey | WorkbookAuthorizationType.Basic | WorkbookAuthorizationType.OAuth2Client) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.type = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationUsername(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.username = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationPassword(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.password = value
            this.dirty = true
        }
    }

    @action
    setAuthorizatinoAccessTokenUrl(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.accessTokenUrl = value
            this.dirty = true
        }
    }
    @action
    setAuthorizationClientId(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.clientId = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationClientSecret(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.clientSecret = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationScope(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.scope = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationSelectedCertificateId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.selectedCertificate =
                entityId === DEFAULT_SELECTION_ID
                    ? undefined
                    : entityId == NO_SELECTION_ID
                        ? NO_SELECTION
                        : { id: entityId, name: GetTitle(this.workspace.certificates.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setAuthorizationSelectedProxyId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.selectedProxy =
                entityId === DEFAULT_SELECTION_ID
                    ? undefined
                    : entityId == NO_SELECTION_ID
                        ? NO_SELECTION
                        : { id: entityId, name: GetTitle(this.workspace.proxies.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setAuthorizationHeader(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.header = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationValue(value: string) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.value = value
            this.dirty = true
        }
    }

    @action
    setAuthorizationPersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Authorization) {
            const auth = this.active as EditableWorkbookAuthorization
            auth.persistence = value
            this.dirty = true
        }
    }

    @action
    addCertificate(targetID?: string | null) {
        const certificate = new EditableWorkbookCertificate()
        certificate.id = GenerateIdentifier()
        this.workspace.certificates.entities.set(certificate.id, certificate)
        addEntity(certificate, this.workspace.certificates, targetID)
        this.changeActive(EditableEntityType.Certificate, certificate.id)
        this.dirty = true
    }

    @action
    deleteCertificate(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedCertificate?.id === id) {
                entity.selectedCertificate = undefined
            }
        }
        if (this.workspace.defaults.selectedCertificate.id == id) {
            this.workspace.defaults.selectedCertificate = NO_SELECTION
        }

        removeEntity(id, this.workspace.certificates)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveCertificate(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity(id, destinationID, onLowerHalf, onLeft, this.workspace.certificates)
        this.dirty = true
    }

    @action
    copyCertificate(id: string) {
        const source = this.workspace.certificates.entities.get(id)
        if (!source) return
        const certificate = new EditableWorkbookCertificate()
        certificate.id = GenerateIdentifier()
        certificate.name = `${GetTitle(source)} - Copy`
        certificate.type = source.type
        certificate.dirty = true
        certificate.pem = source.pem
        certificate.key = source.key
        certificate.pfx = source.pfx
        certificate.password = source.password
        const idx = this.workspace.certificates.topLevelIds.findIndex(cid => cid === source.id)
        if (idx === -1) {
            this.workspace.certificates.topLevelIds.push(certificate.id)
        } else {
            this.workspace.certificates.topLevelIds.splice(idx + 1, 0, certificate.id)
        }
        this.workspace.certificates.entities.set(certificate.id, certificate)
        this.dirty = true
        this.changeActive(EditableEntityType.Certificate, certificate.id)
    }

    getCertificate(id: string) {
        return this.workspace.certificates.entities.get(id)
    }

    @action
    setCertificatePersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificate
            certificate.persistence = value
            this.dirty = true
        }
    }

    @action
    setCertificateType(value: WorkbookCertificateType.PEM | WorkbookCertificateType.PKCS8_PEM | WorkbookCertificateType.PKCS12) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificate
            certificate.type = value
            this.dirty = true
        }
    }

    @action
    setCertificatePem(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificate
            certificate.pem = value
            this.dirty = true
        }
    }

    @action
    setCertificateKey(value: string | undefined) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificate
            certificate.key = value || ''
            this.dirty = true
        }
    }

    @action
    setCertificatePfx(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificate
            certificate.pfx = value
            this.dirty = true
        }
    }

    @action
    setCertificatePassword(value: string) {
        if (this.active?.entityType === EditableEntityType.Certificate) {
            const certificate = this.active as EditableWorkbookCertificate
            certificate.password = value
            this.dirty = true
        }
    }

    @action
    addProxy(targetID?: string | null) {
        const proxy = new EditableWorkbookProxy()
        proxy.id = GenerateIdentifier()
        this.workspace.proxies.entities.set(proxy.id, proxy)
        addEntity(proxy, this.workspace.proxies, targetID)
        this.changeActive(EditableEntityType.Proxy, proxy.id)
        this.dirty = true
    }

    @action
    deleteProxy(id: string) {
        for (const entity of this.workspace.requests.entities.values()) {
            if (entity.selectedProxy?.id === id) {
                entity.selectedProxy = undefined
            }
        }
        if (this.workspace.defaults.selectedProxy.id == id) {
            this.workspace.defaults.selectedProxy = NO_SELECTION
        }
        removeEntity(id, this.workspace.proxies)
        this.clearActive()
        this.dirty = true
    }

    @action
    moveProxy(id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) {
        moveEntity(id, destinationID, onLowerHalf, onLeft, this.workspace.proxies)
        this.dirty = true
        // if (selectedProxyId !== id) {
        //     activateProxy(id)
        // }
    }

    @action
    copyProxy(id: string) {
        const source = this.workspace.proxies.entities.get(id)
        if (source) {
            const proxy = new EditableWorkbookProxy()
            proxy.id = GenerateIdentifier()
            proxy.name = `${GetTitle(source)} - Copy`
            proxy.url = source.url
            proxy.dirty = true
            const idx = this.workspace.proxies.topLevelIds.findIndex(pid => pid === id)
            if (idx === -1) {
                this.workspace.proxies.topLevelIds.push(proxy.id)
            } else {
                this.workspace.proxies.topLevelIds.splice(idx + 1, 0, proxy.id)
            }
            this.workspace.proxies.entities.set(proxy.id, proxy)
            this.dirty = true
            this.changeActive(EditableEntityType.Proxy, proxy.id)
        }
    }

    @action
    setProxyUrl(url: string) {
        if (this.active?.entityType === EditableEntityType.Proxy) {
            const proxy = this.active as EditableWorkbookProxy
            proxy.url = url
            this.dirty = true
        }
    }

    @action
    setProxyPersistence(value: Persistence) {
        if (this.active?.entityType === EditableEntityType.Proxy) {
            const proxy = this.active as EditableWorkbookProxy
            proxy.persistence = value
            this.dirty = true
        }
    }

    getProxy(id: string) {
        return this.workspace.proxies.entities.get(id)
    }

    getExecution(requestOrGroupId: string) {
        let execution = this.executions.get(requestOrGroupId)
        if (!execution) {
            execution = new WorkbookExecutionEntry(requestOrGroupId)
            this.executions.set(requestOrGroupId, execution)
        }
        return execution
    }

    deleteExecution(requestOrGroupId: string) {
        this.executions.delete(requestOrGroupId)
    }

    getExecutionResult(requestOrGroupId: string, executionResultId: string): WorkbookExecutionResult | undefined {
        return this.executions.get(requestOrGroupId)?.results.get(executionResultId)
    }

    getExecutionResultDetails(requestOrGroupId: string, executionResultId: string): ApicizeExecutionDetails | undefined {
        const execution = this.executions.get(requestOrGroupId)?.results.get(executionResultId)
        const executedRequest =
            (execution?.type === 'request') ? execution : undefined
        let originalVariables
        let request
        if (executedRequest?.request) {
            request = toJS(executedRequest.request)
            originalVariables = request.variables ? { ...request.variables } : undefined
            request.variables = undefined
        } else {
            request = undefined
            originalVariables = undefined
        }
        return execution
            ? {
                runNumber: execution.runNumber,
                executedAt: execution.executedAt,
                duration: execution.duration,
                testingContext: executedRequest
                    ? {
                        request: executedRequest.request,
                        response: executedRequest.response,
                        variables: originalVariables
                    }
                    : undefined,
                success: execution.success,
                error: executedRequest?.error ?? undefined,
                tests: executedRequest?.tests?.map(t => ({
                    testName: t.testName,
                    success: t.success,
                    error: t.error ?? undefined,
                    logs: t.logs ?? undefined
                })),
                outputVariables: executedRequest?.variables,
                requestsWithPassedTestsCount: execution.requestsWithPassedTestsCount,
                requestsWithFailedTestsCount: execution.requestsWithFailedTestsCount,
                requestsWithErrors: execution.requestsWithErrors,
                passedTestCount: execution.passedTestCount,
                failedTestCount: execution.failedTestCount
            }
            : undefined

    }

    getExecutionResposne(requestOrGroupId: string): ApicizeExecution | undefined {
        return this.executions.get(requestOrGroupId)?.response
    }

    @action
    reportExecutionResults(execution: WorkbookExecution, executionResults: ApicizeExecution) {
        execution.running = false
        const previousPanel = execution.panel

        if (executionResults.items.length < 1) return

        const menu: WorkbookExecutionMenuItem[] = []
        const results = new Map<string, WorkbookExecutionResult>()
        let allTestsSucceeded: boolean | null = null

        const getTitle = (name: string, runNumber: number, numberOfRuns: number, level: number) => {
            return numberOfRuns > 1
                ? ((level === 0) ? `Run ${runNumber + 1} of ${numberOfRuns}` : `${name} (Run ${runNumber + 1} of ${numberOfRuns})`)
                : name
        }

        const addGroupResult = (item: ApicizeExecutionGroup, level: number): string[] => {
            const executionResultIds: string[] = []
            const numberOfRuns = item.runs.length
            for (let runNumber = 0; runNumber < numberOfRuns; runNumber++) {
                const run = item.runs[runNumber]
                const title = getTitle(item.name, runNumber, numberOfRuns, level)
                allTestsSucceeded = (allTestsSucceeded ?? true) && (run.requestsWithErrors + run.requestsWithFailedTestsCount === 0)
                const group: WorkbookExecutionGroup = {
                    childExecutionIDs: [],
                    type: 'group',
                    id: item.id,
                    name: item.name,
                    runNumber: runNumber + 1,
                    numberOfRuns,
                    executedAt: run.executedAt,
                    duration: run.duration,
                    success: run.success,
                    requestsWithPassedTestsCount: run.requestsWithPassedTestsCount,
                    requestsWithFailedTestsCount: run.requestsWithFailedTestsCount,
                    requestsWithErrors: run.requestsWithErrors,
                    passedTestCount: run.passedTestCount,
                    failedTestCount: run.passedTestCount
                }
                const executionResultId = GenerateIdentifier()
                executionResultIds.push(executionResultId)
                menu.push({ executionResultId, title, level })
                results.set(executionResultId, group)

                for (const child of run.items) {
                    group.childExecutionIDs = [...group.childExecutionIDs, ...addResult(child, level + 1)]
                }
            }
            return executionResultIds
        }

        const addRequestResult = (item: ApicizeExecutionRequest, level: number): string[] => {
            const executionResultIds: string[] = []
            const numberOfRuns = item.runs.length
            for (let runNumber = 0; runNumber < numberOfRuns; runNumber++) {
                const run = item.runs[runNumber]
                const title = getTitle(item.name, runNumber, numberOfRuns, level)
                allTestsSucceeded = (allTestsSucceeded ?? true) && (run.requestsWithErrors + run.requestsWithFailedTestsCount === 0)
                const executionResultId = GenerateIdentifier()
                executionResultIds.push(executionResultId)
                menu.push({ executionResultId, title, level })
                results.set(executionResultId, {
                    type: 'request',
                    id: item.id,
                    name: item.name,
                    run: runNumber + 1,
                    numberOfRuns,
                    ...run
                })
            }
            return executionResultIds;
        }

        const addResult = (item: ApicizeExecutionItem, level: number): string[] => {
            switch (item.type) {
                case 'group':
                    return addGroupResult(item, level)
                    break
                case 'request':
                    return addRequestResult(item, level)
                    break
            }
        }

        const result = executionResults.items[0]
        addResult(result, 0)
        execution.resultMenu = menu
        execution.results = results
        execution.resultIndex = (isNaN(execution.resultIndex) || execution.resultIndex >= execution.results.size)
            ? 0 : execution.resultIndex
        execution.response = executionResults
        execution.panel = (result.type === 'request' && previousPanel && allTestsSucceeded) ? previousPanel : 'Info'
    }

    // @action
    // reportExecutionComplete(execution: WorkbookExecution) {
    //     execution.running = false
    // }

    @action
    async executeRequest(requestOrGroupId: string, runs?: number) {
        const requestOrGroup = this.getRequest(requestOrGroupId)
        let execution = this.executions.get(requestOrGroupId)
        if (execution) {
            execution.running = true
        } else {
            execution = new WorkbookExecutionEntry(requestOrGroupId)
            execution.running = true
            this.executions.set(requestOrGroupId, execution)
        }

        if (!(execution && requestOrGroup)) throw new Error(`Invalid ID ${requestOrGroupId}`)

        let idx = this.executingRequestIDs.indexOf(execution.requestOrGroupId)
        if (idx === -1) {
            this.executingRequestIDs.push(requestOrGroupId)
        }
        try {
            let executionResults = await this.callbacks.onExecuteRequest(this.getWorkspace(), requestOrGroupId, runs)
            this.reportExecutionResults(execution, executionResults)
        } finally {
            this.reportExecutionComplete(execution)
        }
    }

    @action
    reportExecutionComplete(execution: WorkbookExecution) {
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
        await Promise.all(
            this.workspace.authorizations.topLevelIds.map(this.callbacks.onClearToken)
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
        if (this.active?.entityType === EditableEntityType.Defaults) {
            const defaults = this.active as EditableWorkbookDefaults
            defaults.selectedScenario = entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.scenarios.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setDefaultAuthorizationId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Defaults) {
            const defaults = this.active as EditableWorkbookDefaults
            defaults.selectedAuthorization = entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.authorizations.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setDefaultCertificateId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Defaults) {
            const defaults = this.active as EditableWorkbookDefaults
            defaults.selectedCertificate = entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.certificates.entities.get(entityId)) }
            this.dirty = true
        }
    }

    @action
    setDefaultProxyId(entityId: string) {
        if (this.active?.entityType === EditableEntityType.Defaults) {
            const defaults = this.active as EditableWorkbookDefaults
            defaults.selectedProxy = entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.proxies.entities.get(entityId)) }
            this.dirty = true
        }
    }
}

class WorkbookExecutionEntry implements WorkbookExecution {
    @observable accessor running = false
    @observable accessor resultIndex = NaN
    @observable accessor resultMenu: WorkbookExecutionMenuItem[] = []
    @observable accessor results = new Map<string, WorkbookExecutionRequest | WorkbookExecutionGroup>()
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

export enum SshFileType {
    PEM = 'PEM',
    Key = 'Key',
    PFX = 'PFX',
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