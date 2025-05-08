import { Identifiable } from "@apicize/lib-typescript"
import { action, computed, observable } from "mobx"
import { EditableEntityType } from "./workspace/editable-entity-type"
import { EditableProxy } from "./workspace/editable-proxy"
import { EditableRequest } from "./workspace/editable-request"
import { EditableRequestGroup } from "./workspace/editable-request-group"
import { EditableAuthorization } from "./workspace/editable-authorization"
import { EditableScenario } from "./workspace/editable-scenario"
import { EditableCertificate } from "./workspace/editable-certificate"
import { WorkspaceStore } from "../contexts/workspace.context"
import { EditableDefaults } from "./workspace/editable-defaults"

export type EditableEntity = EditableRequest | EditableRequestGroup | EditableScenario | EditableAuthorization
    | EditableCertificate | EditableProxy | EditableDefaults

/**
 * Interface to track state of editable entity
 */
export abstract class Editable<T> {
    @observable accessor id: string = ''
    @observable accessor name: string = ''
    @observable accessor dirty: boolean = false
    abstract accessor state: EditableState

    public abstract readonly entityType: EditableEntityType
    protected abstract onUpdate(): void

    constructor(protected workspace: WorkspaceStore) { }


    markAsDirty() {
        this.dirty = true
    }

    @action
    setName(value: string) {
        this.name = value
        this.onUpdate()
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