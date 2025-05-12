import { NameValuePair } from "@apicize/lib-typescript"
import { action, makeObservable, observable } from "mobx"
import { EntityHeaders, WorkspaceStore } from "../../contexts/workspace.context"
import { Editable, EditableState } from "../editable"
import { EntityType } from "./entity-type"
import { EditableNameValuePair } from "./editable-name-value-pair"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
export class EditableRequestHeaders extends Editable<NameValuePair> {
    public readonly entityType = EntityType.Headers
    public readonly state = EditableState.None

    @observable public accessor headers: EditableNameValuePair[] = []

    public constructor(entity: EntityHeaders, workspace: WorkspaceStore) {
        super(workspace)
        this.id = entity.id
        this.headers = entity.headers?.map(h => ({
            id: GenerateIdentifier(),
            ...h
        })) ?? []
        makeObservable(this)
    }

    public onUpdate() {
        this.markAsDirty()
        this.workspace.updateHeaders({
            entityType: 'Headers',
            id: this.id,
            headers: this.headers,
        })
    }

    @action
    setHeaders(value: EditableNameValuePair[] | undefined) {
        this.headers = value ?? []
        this.onUpdate()
    }

    @action
    refreshFromExternalUpdate(entity: EntityHeaders) {
        this.headers = entity.headers?.map((h) => ({ id: GenerateIdentifier(), ...h })) ?? []
    }
}
