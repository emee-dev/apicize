import { Identifiable } from "./identifiable"

/**
 * Indexed storage with hierarchichal support
 */
export interface IndexedEntities<T extends Identifiable> {
    /**
     * List of all entities (not in sorted or hierarchical order)
     */
    entities: { [id: string]: T },

    /**
     * Sorted list of IDs for top level IDs
     */
    topLevelIds: string[]

    /**
     * List of children (if any) for hierarchical ID
     */
    childIds: { [id: string]: string[] }
}

