import { Selection, SelectedParametersWithData, GetTitle } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable, toJS } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { NO_SELECTION, NO_SELECTION_ID } from "../store"
import { IndexedEntityManager } from "../indexed-entity-manager"
import { WorkspaceStore } from "../../contexts/workspace.context"
import { EditableExternalDataEntry } from "./editable-external-data-entry"

export class EditableExternalData {
    @observable accessor data = new IndexedEntityManager<EditableExternalDataEntry>(new Map(), [], new Map())
    public dirty = false;

    public constructor(data: IndexedEntityManager<EditableExternalDataEntry>,
        private readonly workspace: WorkspaceStore) {
        this.data = data
    }

    static fromWorkspace(data: IndexedEntityManager<EditableExternalDataEntry>, workspace: WorkspaceStore): EditableExternalData {
        return new EditableExternalData(data, workspace)
    }

    toWorkspace(): IndexedEntityManager<EditableExternalDataEntry> | undefined {
        return this.data.entities.size > 0
            ? this.data
            : undefined
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

