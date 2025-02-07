import { Proxy } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { computed, observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"

export class EditableProxy extends Editable<Proxy> {
    public readonly entityType = EditableEntityType.Proxy
    @observable accessor url = ''

    static fromWorkspace(entry: Proxy): EditableProxy {
        const result = new EditableProxy()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.url = entry.url
        return result
    }

    toWorkspace(): Proxy {
        return {
            id: this.id,
            name: this.name,
            url: this.url
        }
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
