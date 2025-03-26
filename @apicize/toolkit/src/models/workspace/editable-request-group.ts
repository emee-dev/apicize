import { RequestGroup, GroupExecution } from "@apicize/lib-typescript"
import { observable, computed, action } from "mobx"
import { GenerateIdentifier } from "../../services/random-identifier-generator"
import { EditableState } from "../editable"
import { EditableEntityType } from "./editable-entity-type"
import { WorkspaceStore } from "../../contexts/workspace.context"
import { EditableRequestEntry } from "./editable-request-entry"

export class EditableRequestGroup extends EditableRequestEntry {
    public readonly entityType = EditableEntityType.Group

    @observable public accessor execution = GroupExecution.Sequential

    @observable accessor timeout = 0

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
        this.warnings = entry.warnings
            ? new Map(entry.warnings.map(w => [GenerateIdentifier(), w]))
            : new Map<string, string>()
    }

    static fromWorkspace(entry: RequestGroup, workspace: WorkspaceStore): EditableRequestGroup {
        return new EditableRequestGroup(entry, workspace)
    }

    toWorkspace(): RequestGroup {
        return {
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
        } as RequestGroup
    }

    @action
    setGroupExecution(value: GroupExecution) {
        this.execution = value
        this.markAsDirty()
    }
}
