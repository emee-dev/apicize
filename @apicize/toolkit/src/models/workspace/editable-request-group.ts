import { RequestGroup, GroupExecution } from "@apicize/lib-typescript"
import { observable, action, computed } from "mobx"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EntityType } from "./entity-type"
import { EntityGroup, WorkspaceStore } from "../../contexts/workspace.context"
import { EditableRequestEntry } from "./editable-request-entry"
import { EditableWarnings } from "./editable-warnings"

export class EditableRequestGroup extends EditableRequestEntry {
    public readonly entityType = EntityType.Group

    @observable public accessor execution = GroupExecution.Sequential

    @observable accessor timeout = 0
    @observable accessor warnings = new EditableWarnings()

    public constructor(entry: RequestGroup, workspace: WorkspaceStore) {
        super(workspace)
        this.id = entry.id
        this.name = entry.name ?? ''

        this.execution = entry.execution
        this.multiRunExecution = entry.multiRunExecution

        this.runs = entry.runs
        this.selectedScenario = entry.selectedScenario ?? undefined
        this.selectedAuthorization = entry.selectedAuthorization ?? undefined
        this.selectedCertificate = entry.selectedCertificate ?? undefined
        this.selectedProxy = entry.selectedProxy ?? undefined
        this.selectedData = entry.selectedData ?? undefined
        this.warnings.set(entry.warnings)
    }

    protected onUpdate() {
        this.markAsDirty()
        this.workspace.updateGroup({
            entityType: 'Group',
            id: this.id,
            name: this.name,
            runs: this.runs,
            execution: this.execution,
            multiRunExecution: this.multiRunExecution,
            selectedScenario: this.selectedScenario ?? undefined,
            selectedAuthorization: this.selectedAuthorization ?? undefined,
            selectedCertificate: this.selectedCertificate ?? undefined,
            selectedProxy: this.selectedProxy ?? undefined,
            selectedData: this.selectedData ?? undefined,
            warnings: this.warnings.hasEntries ? [...this.warnings.entries.values()] : undefined,
            validationErrors: this.validationErrors
        })
    }

    @action
    setGroupExecution(value: GroupExecution) {
        this.execution = value
        this.onUpdate()
    }

    @action
    refreshFromExternalUpdate(entity: EntityGroup) {
        this.name = entity.name ?? ''
        this.runs = entity.runs
        this.execution = entity.execution
        this.multiRunExecution = entity.multiRunExecution
        this.selectedScenario = entity.selectedScenario
        this.selectedAuthorization = entity.selectedAuthorization
        this.selectedCertificate = entity.selectedCertificate
        this.selectedProxy = entity.selectedProxy
        this.selectedData = entity.selectedData
        this.warnings.set(entity.warnings)
    }

    @action
    deleteWarning(id: string) {
        this.warnings.delete(id)
        this.onUpdate()
    }

    @computed get nameInvalid() {
        return ((this.name?.length ?? 0) === 0)
    }

    @computed get validationErrors(): { [property: string]: string } | undefined {
        const results: { [property: string]: string } = {}
        if (this.nameInvalid) {
            results.name = 'Name is required'
        }
        return Object.keys(results).length > 0 ? results : undefined
    }
}