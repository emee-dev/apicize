import { Identifiable } from "@apicize/lib-typescript"
import { action, computed, observable } from "mobx"
import { EditableEntityType } from "./workspace/editable-entity-type"
import { EditableProxy } from "./workspace/editable-proxy"
import { EditableRequest } from "./workspace/editable-request"
import { EditableRequestGroup } from "./workspace/editable-request-group"
import { EditableAuthorization } from "./workspace/editable-authorization"
import { EditableScenario } from "./workspace/editable-scenario"
import { EditableCertificate } from "./workspace/editable-certificate"
import { EditableWarnings } from "./workspace/editable-warnings"
import { EditableDefaults } from "./workspace/editable-defaults"
import { WorkspaceStore } from "../contexts/workspace.context"

// export interface EditableItem extends Identifiable {
//     readonly name: string
//     readonly dirty: boolean
//     readonly state: EditableState

//     readonly entityType: EditableEntityType
// }

export type EditableItem = EditableRequest | EditableRequestGroup | EditableScenario | EditableAuthorization
    | EditableCertificate | EditableProxy

/**
 * Interface to track state of editable entity
 */
export abstract class Editable<T> {
    @observable accessor id: string = ''
    @observable accessor name: string = ''
    @observable accessor dirty: boolean = false
    abstract accessor state: EditableState

    public abstract readonly entityType: EditableEntityType

    constructor(protected workspace: WorkspaceStore) { }

    @action
    setName(value: string) {
        this.name = value
        this.markAsDirty()
    }

    markAsDirty() {
        this.dirty = true
        this.workspace.dirty = true
    }

    @computed
    get nameInvalid() {
        return this.dirty && ((this.name?.length ?? 0) === 0)
    }
}

export enum EditableState {
    None,
    Running,
    Warning
}