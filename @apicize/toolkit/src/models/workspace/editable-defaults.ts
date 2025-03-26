import { Selection, SelectedParametersWithData, GetTitle } from "@apicize/lib-typescript"
import { EditableState } from "../editable"
import { action, computed, observable, toJS } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { NO_SELECTION, NO_SELECTION_ID } from "../store"
import { IndexedEntityManager } from "../indexed-entity-manager"
import { WorkspaceStore } from "../../contexts/workspace.context"

export class EditableDefaults implements SelectedParametersWithData {
    @observable accessor selectedScenario: Selection = NO_SELECTION
    @observable accessor selectedAuthorization: Selection = NO_SELECTION
    @observable accessor selectedCertificate: Selection = NO_SELECTION
    @observable accessor selectedProxy: Selection = NO_SELECTION
    @observable accessor selectedData: Selection = NO_SELECTION

    @observable accessor id = 'Defaults'
    @observable accessor name = 'Defaults'
    public dirty = false;

    public constructor(defaults: SelectedParametersWithData, private readonly workspace: WorkspaceStore) {
        this.selectedScenario = defaults?.selectedScenario ?? NO_SELECTION
        this.selectedAuthorization = defaults?.selectedAuthorization ?? NO_SELECTION
        this.selectedCertificate = defaults?.selectedCertificate ?? NO_SELECTION
        this.selectedProxy = defaults?.selectedProxy ?? NO_SELECTION
        this.selectedData = defaults?.selectedData ?? NO_SELECTION
    }

    static fromWorkspace(defaults: SelectedParametersWithData, workspace: WorkspaceStore): EditableDefaults {
        return new EditableDefaults(defaults, workspace)
    }

    toWorkspace(): SelectedParametersWithData {
        return {
            selectedScenario: this.selectedScenario.id === NO_SELECTION_ID ? undefined : toJS(this.selectedScenario),
            selectedAuthorization: this.selectedAuthorization.id === NO_SELECTION_ID ? undefined : toJS(this.selectedAuthorization),
            selectedCertificate: this.selectedCertificate.id === NO_SELECTION_ID ? undefined : toJS(this.selectedCertificate),
            selectedProxy: this.selectedProxy.id === NO_SELECTION_ID ? undefined : toJS(this.selectedProxy),
            selectedData: this.selectedData.id === NO_SELECTION_ID ? undefined : toJS(this.selectedData),
        }
    }

    @action
    setScenarioId(entityId: string) {
        this.selectedScenario = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.workspace.scenarios.get(entityId)) }
        this.dirty = true
        this.workspace.dirty = true
    }

    @action
    setAuthorizationId(entityId: string) {
        this.selectedAuthorization = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.workspace.authorizations.get(entityId)) }
        this.dirty = true
        this.workspace.dirty = true
    }

    @action
    setCertificateId(entityId: string) {
        this.selectedCertificate = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.workspace.certificates.get(entityId)) }
        this.dirty = true
        this.workspace.dirty = true
    }

    @action
    setProxyId(entityId: string) {
        this.selectedProxy = entityId == NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.workspace.proxies.get(entityId)) }
        this.dirty = true
        this.workspace.dirty = true
    }
    @action
    setDataId(entityId: string) {
        this.selectedData = entityId === NO_SELECTION_ID
            ? NO_SELECTION
            : { id: entityId, name: GetTitle(this.workspace.externalData.get(entityId)) }
        this.dirty = true
        this.workspace.dirty = true
    }
}

