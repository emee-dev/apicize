import { Selection, SelectedParameters, Workspace } from "@apicize/lib-typescript"
import { EditableItem, EditableState } from "../editable"
import { observable, toJS } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { NO_SELECTION, NO_SELECTION_ID } from "../store"

export class EditableDefaults implements EditableItem, SelectedParameters {
    @observable accessor selectedScenario: Selection = NO_SELECTION
    @observable accessor selectedAuthorization: Selection = NO_SELECTION
    @observable accessor selectedCertificate: Selection = NO_SELECTION
    @observable accessor selectedProxy: Selection = NO_SELECTION

    @observable accessor id = 'Defaults'
    @observable accessor name = 'Defaults'
    public readonly state = EditableState.None;
    public readonly entityType = EditableEntityType.Defaults;
    public readonly dirty = false;

    static fromWorkspace(workspace: Workspace): EditableDefaults {
        const result = new EditableDefaults()
        result.selectedScenario = workspace?.defaults?.selectedScenario ?? NO_SELECTION
        result.selectedAuthorization = workspace?.defaults?.selectedAuthorization ?? NO_SELECTION
        result.selectedCertificate = workspace?.defaults?.selectedCertificate ?? NO_SELECTION
        result.selectedProxy = workspace?.defaults?.selectedProxy ?? NO_SELECTION
        return result
    }

    toWorkspace(): SelectedParameters {
        return {
            selectedScenario: this.selectedScenario.id === NO_SELECTION_ID ? undefined : toJS(this.selectedScenario),
            selectedAuthorization: this.selectedAuthorization.id === NO_SELECTION_ID ? undefined : toJS(this.selectedAuthorization),
            selectedCertificate: this.selectedCertificate.id === NO_SELECTION_ID ? undefined : toJS(this.selectedCertificate),
            selectedProxy: this.selectedProxy.id === NO_SELECTION_ID ? undefined : toJS(this.selectedProxy),
        }
    }
}
