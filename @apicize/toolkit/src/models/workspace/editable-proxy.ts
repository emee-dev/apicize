import { Proxy } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { WorkspaceStore } from "../../contexts/workspace.context"

export class EditableProxy extends Editable<Proxy> {
    public readonly entityType = EditableEntityType.Proxy
    @observable accessor url = ''

    public constructor(entry: Proxy, workspace: WorkspaceStore) { 
        super(workspace)
        this.id = entry.id
        this.name = entry.name ?? ''
        this.url = entry.url            
    }

    static fromWorkspace(entry: Proxy, workspace: WorkspaceStore): EditableProxy {
        return new EditableProxy(entry, workspace)
    }

    toWorkspace(): Proxy {
        return {
            id: this.id,
            name: this.name,
            url: this.url
        }
    }

    @action
    setUrl(value: string) {
        this.name = value
        this.markAsDirty()
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
