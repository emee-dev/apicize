import { Persistence } from "@apicize/lib-typescript"
import { EntityType } from "./workspace/entity-type"

export interface MenuPosition {
    id: string
    type: EntityType
    mouseX: number
    mouseY: number
    persistence: Persistence
}

