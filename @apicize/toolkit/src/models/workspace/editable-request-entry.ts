import { Selection, GroupExecution, Request, RequestGroup, GetTitle } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable, reaction, runInAction } from "mobx"
import { DEFAULT_SELECTION_ID, NO_SELECTION_ID, NO_SELECTION } from "../store"
import { toJS } from "mobx"
import { WorkspaceParameters } from "./workspace-parameters"
import { WorkspaceStore } from "../../contexts/workspace.context"
export abstract class EditableRequestEntry extends Editable<Request | RequestGroup> {
    @observable accessor runs = 0
    @observable public accessor multiRunExecution = GroupExecution.Sequential

    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined
    @observable accessor selectedData: Selection | undefined = undefined

    @observable public accessor parameters: WorkspaceParameters | undefined = undefined

    @observable accessor warnings: Map<string, string> | undefined = undefined

    constructor(workspace: WorkspaceStore) {
        super(workspace)

        reaction(
            () => workspace.data,
            () => runInAction(() => {
                this.parameters = undefined
            })
        )
    }


    @action
    setRuns(value: number) {
        this.runs = value
        this.onUpdate()
    }

    @action
    setMultiRunExecution(value: GroupExecution) {
        this.multiRunExecution = value
        this.onUpdate()
    }

    @action
    setSelectedScenarioId(entityId: string) {
        this.selectedScenario = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: this.workspace.getNavigationName(entityId) }
        this.onUpdate()
    }

    @action
    setSelectedAuthorizationId(entityId: string) {
        this.selectedAuthorization = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: this.workspace.getNavigationName(entityId) }
        this.onUpdate()
    }

    @action
    setSelectedCertificateId(entityId: string) {
        this.selectedCertificate = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: this.workspace.getNavigationName(entityId) }
        this.onUpdate()
    }

    @action
    setSelectedProxyId(entityId: string) {
        this.selectedProxy = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: this.workspace.getNavigationName(entityId) }
        this.onUpdate()
    }

    @action
    setSelectedDataId(entityId: string) {
        this.selectedData = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : { id: entityId, name: this.workspace.data?.find(d => d.id === entityId)?.name ?? "Unnamed" }
        this.onUpdate()
    }

    @action
    setParameters(parameters: WorkspaceParameters) {
        this.parameters = parameters
    }

    @computed get nameInvalid() {
        return this.dirty && ((this.name?.length ?? 0) === 0)
    }

    @computed get state() {
        return this.nameInvalid || (this.warnings?.size ?? 0) > 0
            ? EditableState.Warning
            : EditableState.None
    }
}
