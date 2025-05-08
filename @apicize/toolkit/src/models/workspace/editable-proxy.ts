import { Proxy } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { EntityProxy, WorkspaceStore } from "../../contexts/workspace.context"

export class EditableProxy extends Editable<Proxy> {
    public readonly entityType = EditableEntityType.Proxy
    @observable accessor url = ''

    public constructor(entry: Proxy, workspace: WorkspaceStore) {
        super(workspace)
        this.id = entry.id
        this.name = entry.name ?? ''
        this.url = entry.url
    }

    protected onUpdate() {
        this.markAsDirty()
        this.workspace.updateProxy({
            entityType: 'Proxy',
            id: this.id,
            name: this.name,
            url: this.url
        })
    }

    @action
    setUrl(value: string) {
        this.url = value
        this.onUpdate()
    }

    @action
    refreshFromExternalUpdate(updatedItem: EntityProxy) {
        this.name = updatedItem.name ?? ''
        this.url = updatedItem.url
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get urlInvalid() {
        return ! /^(\{\{.+\}\}|https?:\/\/|socks5:\/\/)(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?$/.test(this.url)
    }

    @computed get state() {
        return (this.nameInvalid || this.urlInvalid)
            ? EditableState.Warning
            : EditableState.None
    }
}
