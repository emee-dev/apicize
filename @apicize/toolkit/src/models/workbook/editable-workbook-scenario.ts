import { Persistence, WorkbookScenario } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { computed, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"

export class EditableWorkbookScenario extends Editable<WorkbookScenario> {
    public readonly entityType = EditableEntityType.Scenario
    @observable accessor persistence = Persistence.Private
    @observable accessor variables: EditableNameValuePair[] = []

    static fromWorkspace(entry: WorkbookScenario): EditableWorkbookScenario {
        const result = new EditableWorkbookScenario()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.persistence = entry.persistence
        result.variables = entry.variables?.map(v => ({
            id: GenerateIdentifier(),
            name: v.name,
            value: v.value,
            disabled: v.disabled
        })) ?? []
        return result
    }

    toWorkspace(): WorkbookScenario {
        return {
            id: this.id,
            name: this.name,
            persistence: this.persistence,
            variables: toJS(this.variables)
        }
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get invalid() {
        return this.nameInvalid
    }    
}

