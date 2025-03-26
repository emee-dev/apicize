import { Selection, GroupExecution, Request, RequestGroup, GetTitle } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable } from "mobx"
import { WorkspaceStore } from "../../contexts/workspace.context"
import { DEFAULT_SELECTION_ID, NO_SELECTION_ID, NO_SELECTION } from "../store"
export abstract class EditableRequestEntry extends Editable<Request | RequestGroup> {
    @observable accessor runs = 0
    @observable public accessor multiRunExecution = GroupExecution.Sequential

    @observable accessor selectedScenario: Selection | undefined = undefined
    @observable accessor selectedAuthorization: Selection | undefined = undefined
    @observable accessor selectedCertificate: Selection | undefined = undefined
    @observable accessor selectedProxy: Selection | undefined = undefined
    @observable accessor selectedData: Selection | undefined = undefined

    @observable accessor warnings: Map<string, string> | undefined = undefined

    public constructor(workspace: WorkspaceStore) {
        super(workspace)
    }

    @action
    setRuns(value: number) {
        this.runs = value
        this.markAsDirty()
    }

    @action
    setMultiRunExecution(value: GroupExecution) {
        this.multiRunExecution = value
        this.markAsDirty()
    }

    @action
    setSelectedScenarioId(entityId: string) {
        this.selectedScenario = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.scenarios.get(entityId)) }
        this.markAsDirty()
    }

    setSelectedAuthorizationId(entityId: string) {
        this.selectedAuthorization = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.authorizations.get(entityId)) }
        this.markAsDirty()
    }

    @action
    setSelectedCertificateId(entityId: string) {
        this.selectedCertificate = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.certificates.get(entityId)) }
        this.markAsDirty()
    }

    @action
    setSelectedProxyId(entityId: string) {
        this.selectedProxy = entityId === DEFAULT_SELECTION_ID
            ? undefined
            : entityId == NO_SELECTION_ID
                ? NO_SELECTION
                : { id: entityId, name: GetTitle(this.workspace.proxies.get(entityId)) }
        this.markAsDirty()
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
