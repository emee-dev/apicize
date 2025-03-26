import { Scenario, Variable, VariableSourceType } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable, toJS } from "mobx"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableEntityType } from "./editable-entity-type"
import { WorkspaceStore } from "../../contexts/workspace.context"

export class EditableVariable implements Variable {

    @observable accessor id: string
    @observable accessor name: string
    @observable accessor type: VariableSourceType
    @observable accessor value: string
    @observable accessor disabled: boolean | undefined

    public constructor(
        id: string,
        name: string,
        type: VariableSourceType,
        value: string,
        disabled?: boolean) {
        this.id = id
        this.name = name
        this.type = type
        this.value = value
        this.disabled = disabled
    }

    toWorkspace(): Variable {
        return {
            name: this.name,
            type: this.type,
            value: this.value,
            disabled: this.disabled
        }
    }

    @action
    public updateName(value: string) {
        this.name = value
    }

    @action
    public updateSourceType(value: VariableSourceType) {
        this.type = value
    }

    @action
    public updateValue(value: string) {
        this.value = value
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get valueError(): string | null {
        switch (this.type) {
            case VariableSourceType.JSON: {
                try {
                    JSON.parse(this.value)
                } catch (_) {
                    return 'Value must ve valid JSON'
                }
            }
                break
            case VariableSourceType.FileJSON:
                if (/^(?!\/\\)(?!.*\.\.)(?!.*\/\/)(?!.*\/\.)[\.\w\/ ]{1,200}\.json$/.exec(this.value) === null) {
                    return 'Value must be a relative .json file name using forward slashes'
                }
                break
            case VariableSourceType.FileCSV:
                if (/^(?!\/\\)(?!.*\.\.)(?!.*\/\/)(?!.*\/\.)[\.\w\/ ]{1,200}\.csv$/.exec(this.value) === null) {
                    return 'Value must be a relative .csv file name using forward slashes'
                }
                break
        }
        return null
    }

    @computed get state() {
        return this.nameInvalid || this.valueError
            ? EditableState.Warning
            : EditableState.None
    }
}

export class EditableScenario extends Editable<Scenario> {
    public readonly entityType = EditableEntityType.Scenario
    @observable accessor variables: EditableVariable[] = []

    public constructor(entry: Scenario, workspace: WorkspaceStore) {
        super(workspace)
        this.id = entry.id
        this.name = entry.name ?? ''
        this.variables = entry.variables?.map(v => new EditableVariable(
            GenerateIdentifier(),
            v.name,
            v.type ?? VariableSourceType.Text,
            v.value,
            v.disabled
        )) ?? []
    }

    static fromWorkspace(entry: Scenario, workspace: WorkspaceStore): EditableScenario {
        return new EditableScenario(entry, workspace)
    }

    toWorkspace(): Scenario {
        return {
            id: this.id,
            name: this.name,
            variables: this.variables.map(v => v.toWorkspace())
        }
    }

    @action
    setVariables(value: EditableVariable[] | undefined) {
        this.variables = value || []
        this.markAsDirty()
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get state() {
        return this.nameInvalid || this.variables.find(v => v.state === EditableState.Warning)
            ? EditableState.Warning
            : EditableState.None
    }
}
