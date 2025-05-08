import { Persistence } from "@apicize/lib-typescript"
import { EditableEntityType } from "./workspace/editable-entity-type"
import { IndexedEntityPosition } from "./workspace/indexed-entity-position"

export interface DraggableData {
    type: EditableEntityType,
    move: (relativeToId: string, relativePosition: IndexedEntityPosition) => void
}

export interface DroppableData {
    acceptAppend: boolean
    acceptReposition: boolean
    acceptsTypes: EditableEntityType[]
    isHeader: boolean
    depth: number
    persistence?: Persistence
}
