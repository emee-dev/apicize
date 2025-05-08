import { Persistence } from "@apicize/lib-typescript"
import { EditableEntityType } from "./workspace/editable-entity-type"

export interface MenuPosition {
    id: string
    type: EditableEntityType
    mouseX: number
    mouseY: number
    persistence: Persistence
}

