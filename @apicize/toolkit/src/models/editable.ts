import { Identifiable } from "@apicize/lib-typescript"
import { observable } from "mobx"
import { EditableEntityType } from "./workbook/editable-entity-type"

export interface EditableItem extends Identifiable {
    readonly name: string
    readonly dirty: boolean
    readonly invalid: boolean

    readonly entityType: EditableEntityType
}

/**
 * Interface to track state of editable entity
 */
export abstract class Editable<T> implements EditableItem {
    @observable accessor id: string = ''
    @observable accessor name: string = ''
    @observable accessor dirty: boolean = false
    abstract accessor invalid: boolean

    public abstract readonly entityType: EditableEntityType

    abstract toWorkspace(): T
}
