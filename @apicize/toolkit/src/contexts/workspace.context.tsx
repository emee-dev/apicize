import { action, makeObservable, observable, toJS } from "mobx"
import { DEFAULT_SELECTION_ID, NO_SELECTION, NO_SELECTION_ID } from "../models/store"
import { WorkbookExecution, WorkbookExecutionGroupSummary, WorkbookExecutionGroupSummaryRequest, WorkbookExecutionResult, WorkbookExecutionRunMenuItem } from "../models/workbook/workbook-execution"
import { editableWorkspaceToStoredWorkspace, newEditableWorkspace, stateToGlobalSettingsStorage, storedWorkspaceToEditableWorkspace } from "../services/apicize-serializer"
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from "../models/workbook/editable-workbook-request"
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario"
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization"
import { EditableWorkbookCertificate } from "../models/workbook/editable-workbook-certificate"
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy"
import {
    Identifiable, Named, IndexedEntities, GetTitle, Persistence, addNestedEntity, removeNestedEntity, moveNestedEntity, getNestedEntity, WorkbookGroupExecution,
    addEntity, removeEntity, moveEntity, WorkbookBodyType, WorkbookMethod, WorkbookBodyData, WorkbookAuthorizationType,
    WorkbookCertificateType, findParentEntity, Workspace, ApicizeExecutionResults, ApicizeRequest, WorkbookRequestGroup
} from "@apicize/lib-typescript"
import { EntitySelection } from "../models/workbook/entity-selection"
import { EditableNameValuePair } from "../models/workbook/editable-name-value-pair"
import { GenerateIdentifier } from "../services/random-identifier-generator"
import { EditableEntityType } from "../models/workbook/editable-entity-type"
import { EditableItem } from "../models/editable"
import { ApicizeResponseBody } from "@apicize/lib-typescript/dist/models/lib/apicize-response"
import { MAX_TEXT_RENDER_LENGTH } from "../controls/viewers/text-viewer"
import { createContext, useContext } from "react"

export class WorkspaceStore {
    /**
     * Workspace representing all requests, scenarios, authorizations, certificates and proxies
     */
    @observable accessor workspace = newEditableWorkspace()

    /**
     * Request executions underway or completed
     */
    @observable accessor requestExecutions = new Map<string, WorkbookExecution>()

    @observable accessor active: EditableItem | null = null

    // *** Placeholde for now... ***
    @observable accessor activeExecutionId: string | null = null

    @observable accessor helpVisible = false
    @observable accessor helpTopic = ''
    @observable accessor nextHelpTopic = ''
    @observable accessor helpHistory: string[] = []

    @observable accessor appName = 'Apicize'
    @observable accessor appVersion = ''
    @observable accessor workbookFullName = ''
    @observable accessor workbookDisplayName = '(New Workbook)'
    @observable accessor dirty: boolean = false
    @observable accessor invalidItems = new Set<string>()

    @observable accessor expandedItems = ['hdr-r', 'hdr-s', 'hdr-a', 'hdr-c', 'hdr-p']

    private defaultRequested = false

    constructor(private readonly callbacks: {
        onExecuteRequest: (workspace: Workspace, requestId: string) => Promise<ApicizeExecutionResults>,
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

    lastWorkbookNotYetRequested() {
        if (this.defaultRequested) return false
        this.defaultRequested = true
        return true
    }

    @action
    newWorkspace() {
        this.workbookFullName = ''
        this.workbookDisplayName = ''
        this.dirty = false
        this.workspace = newEditableWorkspace()
        this.expandedItems = ['hdr-r', 'hdr-s', 'hdr-a', 'hdr-c', 'hdr-p']
        this.requestExecutions.clear()
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
        this.requestExecutions.clear()
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
            this.workspace.selectedScenario,
            this.workspace.selectedAuthorization,
            this.workspace.selectedCertificate,
            this.workspace.selectedProxy,
        )
    }

    getSettings(workbookDirectory: string, lastWorkbookFileName: string | undefined) {
        return stateToGlobalSettingsStorage(
            workbookDirectory,
            lastWorkbookFileName)
    }

    @action
    toggleExpanded(itemId: string, isExpanded: boolean) {
        console.log(`Expanding ${itemId} (${isExpanded})`)
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
                this.nextHelpTopic = 'requests'
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
        this.requestExecutions.delete(id)
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
        const copyEntry = (entry: EditableWorkbookRequest | EditableWorkbookRequestGroup) => {
            if (entry.entityType === EditableEntityType.Request) {
                const request = new EditableWorkbookRequest()
                request.id = GenerateIdentifier()
                request.name = `${GetTitle(entry)} - copy`
                request.runs = entry.runs
                request.dirty = true
                request.url = entry.url
                request.method = entry.method
                request.mode = entry.mode
                request.timeout = entry.timeout
                request.headers = entry.headers.map(h => ({...h, id: GenerateIdentifier() } as EditableNameValuePair))
                request.queryStringParams = entry.queryStringParams.map(q => ({...q, id: GenerateIdentifier() } as EditableNameValuePair))
                request.body = entry.body
                    ? {
                        type: entry.body.type,
                        data: entry.body.data
                    }
                    : {
                        type: WorkbookBodyType.None
                    }
                request.test = entry.test
                this.workspace.requests.entities.set(request.id, request)
                return request
            }

            const group = new EditableWorkbookRequestGroup()
            group.id = GenerateIdentifier()
            group.name = `${GetTitle(entry)} - copy`
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
                            const dupedChildID = copyEntry(childEntry).id
                            dupedChildIDs.push(dupedChildID)
                        }
                    })
                    this.workspace.requests.childIds.set(group.id, dupedChildIDs)
                }
            }
            return group
        }

        const source = getNestedEntity(id, this.workspace.requests)
        const entry = copyEntry(source)
        console.log('Source entry', source)
        console.log('Copied entry', entry)
        this.workspace.requests.entities.set(entry.id, entry)

        let append = true
        if (this.workspace.requests.childIds) {
            for (const childIDs of this.workspace.requests.childIds.values()) {
                let idxChild = childIDs.indexOf(id)
                if (idxChild !== -1) {
                    childIDs.splice(idxChild + 1, 0, entry.id)
                    append = false
                    break
                }
            }
        }

        if (append) {
            const idx = this.workspace.requests.topLevelIds.indexOf(id)
            if (idx !== -1) {
                this.workspace.requests.topLevelIds.splice(idx + 1, 0, entry.id)
                append = false
            }
        }

        if (append) {
            this.workspace.requests.topLevelIds.push(entry.id)
        }

        this.dirty = true
        this.changeActive(EditableEntityType.Request, entry.id)
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
    setRequestQueryStringParams(value: EditableNameValuePair[]) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            request.queryStringParams = value
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
            let oldBodyType = request.body?.type ?? WorkbookBodyType.None
            let newBodyData = request.body?.data
            let newBodyType = value ?? WorkbookBodyType.None

            if (newBodyType !== oldBodyType) {
                switch (newBodyType) {
                    case WorkbookBodyType.Form:
                        const formData = decodeFormData(newBodyData as string)
                        formData.forEach(d => (d as EditableNameValuePair).id = GenerateIdentifier())
                        newBodyData = formData
                        break
                    default:
                        switch (oldBodyType) {
                            case WorkbookBodyType.Form:
                                newBodyData = encodeFormData(newBodyData as EditableNameValuePair[])
                                break
                            case WorkbookBodyType.Raw:
                                const data = newBodyData as number[] | undefined
                                if (data && data.length > 0) {
                                    newBodyData = (new TextDecoder('utf-8')).decode(Uint8Array.from(data))
                                } else {
                                    newBodyData = ''
                                }
                                break
                        }
                        break
                }
            }
            request.body = {
                type: newBodyType,
                data: newBodyData
            }
            this.dirty = true
        }
    }

    @action
    setRequestBodyData(value: WorkbookBodyData | undefined, type: WorkbookBodyType) {
        if (this.active?.entityType === EditableEntityType.Request) {
            const request = this.active as EditableWorkbookRequest
            if (request.body) {
                request.body.type = type
                request.body.data = value
            } else {
                request.body = { type: type, data: value }
            }
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
            ? 'None Configured'
            : activeScenarioId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.scenarios.entities.get(activeScenarioId))

        const defaultAuthorization = activeAuthorizationId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeAuthorizationId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.authorizations.entities.get(activeAuthorizationId))

        const defaultCertificate = activeCertificateId == DEFAULT_SELECTION_ID
            ? 'None Configured'
            : activeCertificateId === NO_SELECTION_ID
                ? 'Off'
                : GetTitle(this.workspace.certificates.entities.get(activeCertificateId))

        const defaultProxy = activeProxyId == DEFAULT_SELECTION_ID
            ? 'None Configured'
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

    getStoredWorkspace() {
        return editableWorkspaceToStoredWorkspace(
            this.workspace.requests,
            this.workspace.scenarios,
            this.workspace.authorizations,
            this.workspace.certificates,
            this.workspace.proxies,
            this.workspace.selectedScenario,
            this.workspace.selectedAuthorization,
            this.workspace.selectedCertificate,
            this.workspace.selectedProxy,
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
    setScenarioVariables(value: EditableNameValuePair[]) {
        if (this.active?.entityType === EditableEntityType.Scenario) {
            const scenario = this.active as EditableWorkbookScenario
            scenario.variables = value
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
        if (source) {
            const authorization = new EditableWorkbookAuthorization()
            authorization.id = GenerateIdentifier()
            authorization.name = `${GetTitle(source)} - Copy`
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
        if (source) {
            const certificate = new EditableWorkbookCertificate()
            certificate.id = GenerateIdentifier()
            certificate.name = `${GetTitle(source)} - Copy`
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
        let execution = this.requestExecutions.get(requestOrGroupId)
        if (!execution) {
            execution = new WorkbookExecutionEntry()
            this.requestExecutions.set(requestOrGroupId, execution)
        }
        return execution
    }

    deleteExecution(requestOrGroupId: string) {
        this.requestExecutions.delete(requestOrGroupId)
    }

    getExecutionGroupSummary(requestOrGroupId: string, runIndex: number): WorkbookExecutionGroupSummary | undefined {
        return this.requestExecutions.get(requestOrGroupId)?.runs?.at(runIndex)?.groupSummary
    }

    getExecutionResult(requestOrGroupId: string, runIndex: number, resultIndex: number): WorkbookExecutionResult | undefined {
        return this.requestExecutions.get(requestOrGroupId)?.results?.get(`${runIndex}-${resultIndex}`)
    }

    getExecutionResultHeaders(requestOrGroupId: string, runIndex: number, resultIndex: number): { [name: string]: string } | undefined {
        return this.getExecutionResult(requestOrGroupId, runIndex, resultIndex)?.response?.headers
    }

    getExecutionResultBody(requestOrGroupId: string, runIndex: number, resultIndex: number): ApicizeResponseBody | undefined {
        return this.getExecutionResult(requestOrGroupId, runIndex, resultIndex)?.response?.body
    }

    getExecutionRequest(requestOrGroupId: string, runIndex: number, resultIndex: number): ApicizeRequest | undefined {
        return this.getExecutionResult(requestOrGroupId, runIndex, resultIndex)?.request
    }

    @action
    reportExecutionResults(execution: WorkbookExecution, group: WorkbookRequestGroup | null, executionResults: ApicizeExecutionResults) {
        execution.running = false
        const previousPanel = execution.panel

        if (executionResults?.runs) {
            let runCtr = 0
            const newRunList: WorkbookExecutionRunMenuItem[] = []
            const newIndexedResults = new Map<string, WorkbookExecutionResult>()

            let allTestsSucceeded = true

            executionResults.runs.forEach((run, runIndex) => {
                const concurrent = group?.execution === WorkbookGroupExecution.Concurrent

                let executedAt = 0
                let milliseconds = 0
                let success = true
                let requests: WorkbookExecutionGroupSummaryRequest[] = []

                const results: { title: string, index: number }[] = []

                if (run.length > 1) {
                    results.push({ title: 'Summary', index: -1 })
                }

                run.forEach((result, resultIndex) => {
                    const index = `${runIndex}-${resultIndex}`
                    const resultRequest = this.getRequest(result.requestId)
                    results.push({ title: `${resultRequest?.name}`, index: resultIndex })
                    newIndexedResults.set(index, {
                        ...result,
                        hasRequest: !!result.request,
                        disableOtherPanels: !result.success,
                        longTextInResponse: (result.response?.body?.text?.length ?? 0) > MAX_TEXT_RENDER_LENGTH,
                        infoColor: result.success
                            ? (result.failedTestCount ?? -1) === 0
                                ? 'success'
                                : 'warning'
                            : 'error'
                    })

                    if (group) {
                        executedAt = Math.min(result.executedAt, executedAt)
                        milliseconds = concurrent
                            ? Math.max(result.milliseconds, milliseconds)
                            : result.milliseconds + milliseconds
                        success = success && result.success
                        const resultRequest = this.getRequest(result.requestId)
                        const requestName = (resultRequest && resultRequest.name.length > 0) ? resultRequest.name : '(Unnamed)'
                        if (allTestsSucceeded && result.tests) {
                            result.tests.forEach(test => allTestsSucceeded = allTestsSucceeded && test.success)
                        }
                        requests.push({
                            requestName,
                            status: result.response?.status,
                            statusText: result.response?.statusText,
                            milliseconds: result.milliseconds,
                            tests: result.tests,
                            errorMessage: result.errorMessage
                        })
                    }
                })


                newRunList.push({
                    title: `Run ${runIndex + 1} of ${executionResults.runs.length}`,
                    results,
                    groupSummary: group ? {
                        executedAt,
                        milliseconds,
                        success,
                        allTestsSucceeded,
                        requests,
                        infoColor: success
                            ? allTestsSucceeded
                                ? 'success'
                                : 'warning'
                            : 'error'

                    } : undefined
                })
            })

            execution.panel = (!group && previousPanel && allTestsSucceeded) ? previousPanel : 'Info'
            execution.runs = newRunList
            execution.results = newIndexedResults

            if (newRunList.length > 0) {
                execution.runIndex = 0
                const entry = newRunList[0]
                execution.resultIndex = entry
                    ? (entry.groupSummary ? -1 : 0)
                    : 0
            }
        }
    }

    @action
    reportExecutionComplete(execution: WorkbookExecution) {
        execution.running = false
    }

    @action
    async executeRequest(requestOrGroupId: string) {
        const request = this.getRequest(requestOrGroupId)
        const group = request?.entityType === EditableEntityType.Group
            ? request as WorkbookRequestGroup
            : null
        let execution = this.requestExecutions.get(requestOrGroupId)
        if (execution) {
            execution.running = true
        } else {
            let execution = new WorkbookExecutionEntry()
            execution.running = true
            this.requestExecutions.set(requestOrGroupId, execution)
        }

        if (!(execution && (request || group))) throw new Error(`Invalid ID ${requestOrGroupId}`)

        try {
            let executionResults = await this.callbacks.onExecuteRequest(this.getWorkspace(), requestOrGroupId)
            this.reportExecutionResults(execution, group, executionResults)
        } finally {
            this.reportExecutionComplete(execution)
        }
    }


    @action
    cancelRequest(requestOrGroupId: string) {
        const match = this.requestExecutions.get(requestOrGroupId)
        if (match) {
            match.running = false
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
        const match = this.requestExecutions.get(requestOrGroupId)
        if (match) {
            match.panel = panel
        }
    }

    @action
    changeRunIndex(requestOrGroupId: string, runIndex: number) {
        const execution = this.requestExecutions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid Request ID ${requestOrGroupId}`)
        execution.runIndex = runIndex
    }

    @action
    changeResultIndex(requestOrGroupId: string, resultIndex: number) {
        const execution = this.requestExecutions.get(requestOrGroupId)
        if (!execution) throw new Error(`Invalid Request ID ${requestOrGroupId}`)
        execution.resultIndex = resultIndex
    }
}

class WorkbookExecutionEntry implements WorkbookExecution {
    @observable accessor running = false
    @observable accessor runIndex = NaN
    @observable accessor resultIndex = NaN
    @observable accessor runs: WorkbookExecutionRunMenuItem[] = []

    @observable accessor panel = 'Info'
    @observable accessor results = new Map<string, WorkbookExecutionResult>()

    constructor() {
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