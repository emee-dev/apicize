import { Selection, WorkbookDefaults, Workspace } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { computed, makeObservable, observable, toJS } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { NO_SELECTION, NO_SELECTION_ID } from "../store"

export class EditableWorkbookDefaults extends Editable<WorkbookDefaults> {
    public readonly entityType = EditableEntityType.Defaults
    @observable accessor selectedScenario: Selection = NO_SELECTION
    @observable accessor selectedAuthorization: Selection  = NO_SELECTION
    @observable accessor selectedCertificate: Selection = NO_SELECTION
    @observable accessor selectedProxy: Selection = NO_SELECTION

    static new() {
        debugger
        const result = new EditableWorkbookDefaults()
        result.id = ''
        result.name = ''
        return result
    }

    static fromWorkbook(workspace: Workspace): EditableWorkbookDefaults {
        debugger
        const result = new EditableWorkbookDefaults()
        result.id = crypto.randomUUID()
        result.name = ''
        result.selectedScenario = workspace?.defaults?.selectedScenario ?? NO_SELECTION
        result.selectedAuthorization = workspace?.defaults?.selectedAuthorization ?? NO_SELECTION
        result.selectedCertificate = workspace?.defaults?.selectedCertificate ?? NO_SELECTION
        result.selectedProxy = workspace?.defaults?.selectedProxy ?? NO_SELECTION
        return result
    }

    toWorkbook(): WorkbookDefaults {
        return {
            selectedScenario: this.selectedScenario.id === NO_SELECTION_ID ? undefined : toJS(this.selectedScenario),
            selectedAuthorization: this.selectedAuthorization.id === NO_SELECTION_ID ? undefined : toJS(this.selectedAuthorization),
            selectedCertificate: this.selectedCertificate.id === NO_SELECTION_ID ? undefined : toJS(this.selectedCertificate),
            selectedProxy: this.selectedProxy.id === NO_SELECTION_ID ? undefined : toJS(this.selectedProxy),
        } 
    }
    @computed get invalid() {
        return false
    }
}
