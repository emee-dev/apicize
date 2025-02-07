import { Identifiable } from "@apicize/lib-typescript"
import { observable } from "mobx"
import { EditableEntityType } from "./workspace/editable-entity-type"

export interface EditableItem extends Identifiable {
    readonly name: string
    readonly dirty: boolean
    readonly state: EditableState

    readonly entityType: EditableEntityType
}

/**
 * Interface to track state of editable entity
 */
export abstract class Editable<T> implements EditableItem {
    @observable accessor id: string = ''
    @observable accessor name: string = ''
    @observable accessor dirty: boolean = false
    abstract accessor state: EditableState

    public abstract readonly entityType: EditableEntityType

    abstract toWorkspace(): T
}

export enum EditableState {
    None,
    Running,
    Warning
}