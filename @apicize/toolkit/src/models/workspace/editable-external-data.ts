import { ExternalData, ExternalDataSourceType } from "@apicize/lib-typescript"
import { Editable, EditableState } from "../editable"
import { action, computed, observable, toJS } from "mobx"
import { EditableEntityType } from "./editable-entity-type"

export class EditableExternalData extends Editable<ExternalData> {

    public readonly entityType = EditableEntityType.ExternalData

    @observable accessor type: ExternalDataSourceType = ExternalDataSourceType.FileJSON
    @observable accessor source: string = ''

    static fromWorkspace(entry: ExternalData): EditableExternalData {
        const result = new EditableExternalData()
        result.id = entry.id
        result.name = entry.name ?? ''
        result.type = entry.type
        result.source = entry.source
        return result
    }

    toWorkspace(): ExternalData {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            source: this.source
        }
    }

    @action
    public updateName(value: string) {
        this.name = value
    }

    @action
    public updateSourceType(value: ExternalDataSourceType) {
        this.type = value
    }

    @action
    public updateSource(value: string) {
        this.source = value
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
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
