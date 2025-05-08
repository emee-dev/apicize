import { Persistence } from "@apicize/lib-typescript"
import { EntityType } from "./workspace/entity-type"
import { IndexedEntityPosition } from "./workspace/indexed-entity-position"

export interface DraggableData {
    type: EntityType,
    move: (relativeToId: string, relativePosition: IndexedEntityPosition) => void
}

export interface DroppableData {
    acceptAppend: boolean
    acceptReposition: boolean
    acceptsTypes: EntityType[]
    isHeader: boolean
    depth: number
    persistence?: Persistence
}
