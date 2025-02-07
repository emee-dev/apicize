import { action, computed, observable, toJS } from "mobx";
import { EditableItem, EditableState } from "../editable";
import { EditableEntityType } from "./editable-entity-type";
import { GenerateIdentifier } from "../../services/random-identifier-generator";

export class EditableWarnings implements EditableItem {
    @observable accessor dirty = false

    public readonly id = 'Warnings'
    public readonly name = 'Warnings'
    public readonly state = EditableState.None;
    @observable accessor entityType = EditableEntityType.Warnings;
    @observable accessor entries = new Map<string, string>()

    @action
    public clear() {
        this.entries.clear()
    }

    @action
    public set(newWarnings?: string[]) {
        if (newWarnings && newWarnings.length > 0) {
            this.entries = new Map(newWarnings.map(w => ([GenerateIdentifier(), w])))
        } else {
            this.entries.clear()
        }
    }

    @action
    public delete(id: string) {
        this.entries.delete(id)
    }

    @computed
    public get hasEntries(): boolean {
        return this.entries.size > 0
    }
}

