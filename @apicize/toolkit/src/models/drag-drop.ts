import { Persistence } from "@apicize/lib-typescript"
import { EditableEntityType } from "./workspace/editable-entity-type"

export interface DraggableData {
    type: EditableEntityType,
    move: (destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => void
}

export interface DroppableData {
    acceptAppend: boolean
    acceptReposition: boolean
    acceptsTypes: EditableEntityType[]
    isHeader: boolean
    depth: number
    persistence?: Persistence
}

export enum DragPosition {
    None = 'NONE',
    Left = 'LEFT',
    Upper = 'UPPER',
    Lower = 'LOWER',
    Invalid = 'INVALID'
}
