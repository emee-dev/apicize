import { action, autorun, computed, observable } from "mobx"
import { EditableEntityType } from "../models/workspace/editable-entity-type"
import { EditableItem } from "../models/editable"
import { WorkspaceStore } from "./workspace.context"
import { createContext, ReactNode, useContext } from "react"
import { EditSession } from "ace-code"

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

export enum RequestEditSessionType {
    Body,
    Test
}

export enum ResultEditSessionType {
    Preview,
    Raw,
    Base64,
    Details
}

export class WorkspaceSessionStore {
    @observable accessor active: EditableItem | null = null
    @observable accessor activeId: string | null = null
    @observable accessor expandedItems: string[] = ['hdr-r']
    @observable accessor mode = WorkspaceMode.Normal;
    @observable accessor helpTopic: string | null = null
    private helpTopicHistory: string[] = []
    public nextHelpTopic: string | null = null

    // Request/Group edit sessions, indexed by request/group ID and then by type (body, test, etc.)
    private requestEditSessions = new Map<string, Map<RequestEditSessionType, EditSession>>()
    // Result edit sessions, indexed by request/group ID, and then by result index, and then by type
    private resultEditSessions = new Map<string, Map<number, Map<ResultEditSessionType, EditSession>>>()

    public constructor(
        public readonly id: string,
        private readonly workspace: WorkspaceStore
    ) { 
        autorun(() => {
            if (workspace.lastExecution) {
                console.log(`Clearing result edit sessoins for request ${workspace.lastExecution.requestOrGroupId}`)
                this.resultEditSessions.delete(workspace.lastExecution.requestOrGroupId)
            }
        })
    }

    @action
    setMode(mode: WorkspaceMode) {
        this.mode = mode
    }

    @action
    updateExpanded(id: string | string[], isExpanded: boolean) {
        const expanded = [...this.expandedItems]
        for (const thisId of Array.isArray(id) ? id : [id]) {
            let idx = expanded.indexOf(thisId)
            if (isExpanded) {
                if (idx === -1) expanded.push(thisId)
            } else {
                if (idx !== -1) expanded.splice(idx, 1)
            }
        }
        this.expandedItems = expanded
    }
    // @action
    // toggleExpanded(itemId: string, isExpanded: boolean) {
    //     let expanded = new Set(this.expandedItems)
    //     if (isExpanded) {
    //         expanded.add(itemId)
    //     } else {
    //         expanded.delete(itemId)
    //     }
    //     this.expandedItems = [...expanded]
    // }

    @action
    changeActive(type: EditableEntityType, id: string) {
        this.activeId = `${type}-${id}`
        switch (type) {
            case EditableEntityType.Request:
            case EditableEntityType.Group:
                this.mode = WorkspaceMode.Normal
                if (id.length > 0) {
                    const r = this.workspace.requests.get(id)
                    if (!r) throw new Error(`Invalid request ID ${id}`)
                    this.active = r
                } else {
                    this.active = null;
                }
                break
            case EditableEntityType.Scenario:
                this.mode = WorkspaceMode.Normal
                const s = this.workspace.scenarios.get(id)
                if (!s) throw new Error(`Invalid scenario ID ${id}`)
                this.active = s
                break
            case EditableEntityType.Authorization:
                this.mode = WorkspaceMode.Normal
                const a = this.workspace.authorizations.get(id)
                if (!a) throw new Error(`Invalid authorization ID ${id}`)
                this.active = a
                break
            case EditableEntityType.Certificate:
                this.mode = WorkspaceMode.Normal
                const c = this.workspace.certificates.get(id)
                if (!c) throw new Error(`Invalid certificate ID ${id}`)
                this.active = c
                break
            case EditableEntityType.Proxy:
                this.mode = WorkspaceMode.Normal
                const p = this.workspace.proxies.get(id)
                if (!p) throw new Error(`Invalid proxy ID ${id}`)
                this.active = p
                break
            case EditableEntityType.Warnings:
                this.mode = WorkspaceMode.Warnings
                this.nextHelpTopic = 'settings'
                break
            default:
                this.active = null
                this.mode = WorkspaceMode.Normal
                break
        }
    }

    @action
    clearAllActive() {
        this.active = null
        this.activeId = null
    }

    @action
    clearActive(type: EditableEntityType, id: string) {
        if (this.activeId === `${type}-${id}`) {
            this.active = null
            this.activeId = null
        }
    }

    /**
     * Returns edit session if exists for the specified request/group
     * @param requestOrGroupId
     * @param type 
     * @returns 
     */
    getRequestEditSession(requestOrGroupId: string, type: RequestEditSessionType) {
        return this.requestEditSessions.get(requestOrGroupId)?.get(type)
    }

    /**
     * Returns edit session if exists for the specified request/group and result index
     * @param requestOrGroupId 
     * @param resultIndex 
     * @param type 
     */
    getResultEditSession(requestOrGroupId: string, resultIndex: number, type: ResultEditSessionType) {
        return this.resultEditSessions.get(requestOrGroupId)?.get(resultIndex)?.get(type)
    }

    @action
    clearAllEditSessions() {
        this.requestEditSessions.clear()
        this.resultEditSessions.clear()
    }

    /**
     * Clear all of the result edit sessions for the specified request or group
     * @param requestOrGroupId 
     */
    @action
    clearResultEditSessions(requestOrGroupId: string) {
        this.resultEditSessions.delete(requestOrGroupId)
    }

    @action
    setRequestEditSession(requestOrGroupId: string, type: RequestEditSessionType, session: EditSession) {
        const match = this.requestEditSessions.get(requestOrGroupId)
        if (match) {
            match.set(type, session)
        } else {
            this.requestEditSessions.set(requestOrGroupId, new Map([[type, session]]))
        }
    }

    @action
    setResultEditSession(requestOrGroupId: string, index: number, type: ResultEditSessionType, session: EditSession) {
        const match = this.resultEditSessions.get(requestOrGroupId)
        if (match) {
            const matchIndex = match.get(index)
            if (matchIndex) {
                matchIndex.set(type, session)
            } else {
                match.set(index, new Map([[type, session]]))
            }
        } else {
            this.resultEditSessions.set(requestOrGroupId, new Map([[index, new Map([[type, session]])]]))
        }
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

export const WorkspaceSessionProvider = ({ navigation, children }: { navigation: WorkspaceSessionStore, children?: ReactNode }) => {
    return <WorkspaceSessionContext.Provider value={navigation}>
        {children}
    </WorkspaceSessionContext.Provider>
}


export const WorkspaceSessionContext = createContext<WorkspaceSessionStore | null>(null)

export function useWorkspaceSession() {
    const context = useContext(WorkspaceSessionContext);
    if (!context) {
        throw new Error('useWorkspaceSession must be used within a WorkspaceSessionContext.Provider');
    }
    return context;
}
