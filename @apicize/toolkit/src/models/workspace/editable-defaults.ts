import { Selection, SelectedParameters, Workspace, SelectedParametersWithData } from "@apicize/lib-typescript"
import { EditableItem, EditableState } from "../editable"
import { computed, observable, toJS } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { NO_SELECTION, NO_SELECTION_ID } from "../store"
import { IndexedEntityManager } from "../indexed-entity-manager"
import { EditableExternalData } from "./editable-external-data"

export class EditableDefaults implements EditableItem, SelectedParametersWithData {
    @observable accessor selectedScenario: Selection = NO_SELECTION
    @observable accessor selectedAuthorization: Selection = NO_SELECTION
    @observable accessor selectedCertificate: Selection = NO_SELECTION
    @observable accessor selectedProxy: Selection = NO_SELECTION
    @observable accessor selectedData: Selection = NO_SELECTION

    @observable accessor data = new IndexedEntityManager<EditableExternalData>(new Map(), [], new Map())

    @observable accessor id = 'Defaults'
    @observable accessor name = 'Defaults'
    public readonly entityType = EditableEntityType.Defaults;
    public readonly dirty = false;

    static fromWorkspace(workspace: Workspace, data: IndexedEntityManager<EditableExternalData>): EditableDefaults {
        const result = new EditableDefaults()
        result.selectedScenario = workspace?.defaults?.selectedScenario ?? NO_SELECTION
        result.selectedAuthorization = workspace?.defaults?.selectedAuthorization ?? NO_SELECTION
        result.selectedCertificate = workspace?.defaults?.selectedCertificate ?? NO_SELECTION
        result.selectedProxy = workspace?.defaults?.selectedProxy ?? NO_SELECTION
        result.selectedData = workspace?.defaults?.selectedData ?? NO_SELECTION
        result.data = data;
        return result
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

    @computed get dataInvalid() {
        let invalid = false
        for (const d of this.data.values) {
            if (d.nameInvalid) {
                invalid = true
            }
        }
        return invalid
    }

    @computed get state() {
        return (this.dataInvalid)
            ? EditableState.Warning
            : EditableState.None
    }

}

