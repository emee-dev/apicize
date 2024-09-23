import { Identifiable } from "./identifiable"

/**
 * Indexed storage
 */
export interface IndexedEntities<T extends Identifiable> {
    /**
     * List of all entities (not in sorted or hierarchical order)
     */
    entities: Map<string, T>,

    /**
     * Sorted list of IDs for top level IDs
     */
    topLevelIds: string[]
}

/**
 * Utility to add an entity to storage, optionally before the specified ID
 * @param id 
 * @param storage 
 * @returns 
 */
export function addEntity<T extends Identifiable>(entity: T, storage: IndexedEntities<T>, beforeId?: string | null) {
    storage.entities.set(entity.id, entity)
    if (beforeId) {
        let idx = storage.topLevelIds.indexOf(beforeId)
        if (idx !== -1) {
            storage.topLevelIds.splice(idx, 0, entity.id)
            return
        }
    }
    storage.topLevelIds.push(entity.id)
}


/**
 * Utility to locate the specified ID in storage
 * @param id 
 * @param storage 
 * @returns 
 */
export function getEntity<T extends Identifiable>(id: string, storage: IndexedEntities<T>): T {
    const result = storage.entities.get(id)
    if (! result) {
        throw new Error(`Unable to find entry ID ${id}`)
    }
    return result
}

/**
 * Utility to delete the specified ID in storage
 * @param id 
 * @param storage 
 * @returns 
 */
export function removeEntity<T extends Identifiable>(id: string, storage: IndexedEntities<T>): void {
    let found = false
    let idx = storage.topLevelIds.indexOf(id)
    if (idx !== -1) {
        storage.topLevelIds.splice(idx, 1)
    }
    storage.entities.delete(id)
}

/**
 * Move an item ID to a different destination
 * @param id 
 * @param destinationID 
 * @param storage 
 */
export function moveEntity<T extends Identifiable >(
    id: string,
    destinationID: string | null,
    onLowerHalf: boolean | null,
    onLeft: boolean | null,
    storage: IndexedEntities<T>) {
    
    const sourceIndex = storage.topLevelIds.indexOf(id)

    let destIndex: number
    if (destinationID === null) {
        // If there is no destination ID, then we are moving to the top of the list
        destIndex = 0
    } else {
        destIndex = storage.topLevelIds.indexOf(destinationID)
        if (onLowerHalf) {
            destIndex++
        }
    }
    if (destIndex === -1) {
        // Handle appends
        storage.topLevelIds.splice(sourceIndex, 1)
        storage.topLevelIds.push(id)
    } else {
        // Handle moving within the same list...
        storage.topLevelIds.splice(destIndex, 0, id)
        if (sourceIndex < destIndex) {
            storage.topLevelIds.splice(sourceIndex, 1)
        } else {
            storage.topLevelIds.splice(sourceIndex + 1, 1)
        }
    }
}
