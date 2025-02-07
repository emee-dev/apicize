import { Scenario } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { computed, observable, toJS } from "mobx"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"

export class EditableScenario extends Editable<Scenario> {
    public readonly entityType = EditableEntityType.Scenario
    @observable accessor variables: EditableNameValuePair[] = []

    static fromWorkspace(entry: Scenario): EditableScenario {
        const result = new EditableScenario()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.variables = entry.variables?.map(v => ({
            id: GenerateIdentifier(),
            name: v.name,
            value: v.value,
            disabled: v.disabled
        })) ?? []
        return result
    }

    toWorkspace(): Scenario {
        return {
            id: this.id,
            name: this.name,
            variables: toJS(this.variables)
        }
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get state() {
        return this.nameInvalid
            ? EditableState.Warning
            : EditableState.None
    }
}
