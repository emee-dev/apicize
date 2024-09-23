import { Persistence, WorkbookProxy } from "@apicize/lib-typescript"
import { Editable } from "../editable"
import { computed, observable } from "mobx"
import { EditableEntityType } from "./editable-entity-type"

export class EditableWorkbookProxy extends Editable<WorkbookProxy> {
    public readonly entityType = EditableEntityType.Proxy
    @observable accessor persistence = Persistence.Private
    @observable accessor url = ''

    static fromWorkspace(entry: WorkbookProxy): EditableWorkbookProxy {
        const result = new EditableWorkbookProxy()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.persistence = entry.persistence
        result.url = entry.url
        return result
    }

    toWorkspace(): WorkbookProxy {
        return {
            id: this.id,
            name: this.name,
            persistence: this.persistence,
            url: this.url
        }
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get urlInvalid() {
        return ! /^[(?:https?),socks5]:\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(this.url)
    }

    @computed get invalid() {
        return ! (
            this.nameInvalid
            || this.urlInvalid
        )
    }    
}
