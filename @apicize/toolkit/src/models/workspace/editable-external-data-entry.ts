import { ExternalDataEntry, ExternalDataSourceType } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable, toJS } from "mobx"
import { EditableEntityType } from "./editable-entity-type"
import { WorkspaceStore } from "../../contexts/workspace.context"

export class EditableExternalDataEntry extends Editable<ExternalDataEntry> {

    public readonly entityType = EditableEntityType.ExternalData

    @observable accessor type: ExternalDataSourceType = ExternalDataSourceType.FileJSON
    @observable accessor source: string = ''

    public constructor(entry: ExternalDataEntry, workspace: WorkspaceStore) {
        super(workspace)
        this.id = entry.id
        this.name = entry.name ?? ''
        this.type = entry.type
        this.source = entry.source
    }

    static fromWorkspace(entry: ExternalDataEntry, workspace: WorkspaceStore): EditableExternalDataEntry {
        return new EditableExternalDataEntry(entry, workspace)
    }

    toWorkspace(): ExternalDataEntry {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            source: this.source
        }
    }
    @action
    public setSourceType(value: ExternalDataSourceType) {
        this.type = value
        this.markAsDirty()
    }

    @action
    public setSource(value: string) {
        this.source = value
        this.markAsDirty()
    }

    @computed get sourceError(): string | null {
        switch (this.type) {
            case ExternalDataSourceType.JSON: {
                try {
                    JSON.parse(this.source)
                } catch (_) {
                    return 'Value must ve valid JSON'
                }
            }
                break
            case ExternalDataSourceType.FileJSON:
                if (/^(?!\/\\)(?!.*\.\.)(?!.*\/\/)(?!.*\/\.)[\.\w\/ ]{1,200}\.json$/.exec(this.source) === null) {
                    return 'Value must be a relative .json file name using forward slashes'
                }
                break
            case ExternalDataSourceType.FileCSV:
                if (/^(?!\/\\)(?!.*\.\.)(?!.*\/\/)(?!.*\/\.)[\.\w\/ ]{1,200}\.csv$/.exec(this.source) === null) {
                    return 'Value must be a relative .csv file name using forward slashes'
                }
                break
        }
        return null
    }

    @computed get state() {
        return this.nameInvalid || this.sourceError
            ? EditableState.Warning
            : EditableState.None
    }
}
