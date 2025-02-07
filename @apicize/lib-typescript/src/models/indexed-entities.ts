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

export class IndexedEntityManager<T extends Identifiable> {
    private cachedEntities: T[] | null = null

    public constructor(
        private entityMap: Map<string, T>,
        private topLevelIdList: string[],
        private childIdMap: Map<string, string[]>
    ) { }

    /**
     * Clear all stored entries
     */
    public reset() {
        this.entityMap = new Map()
        this.topLevelIdList = []
        this.childIdMap = new Map()
    }

    /**
     * Find the parent, if any, of the specified ID
     * @param id 
     * @returns 
     */
    public findParent(id: string | null) {
        if (id) {
            for (const [parentId, assignedIds] of this.childIdMap) {
                if (assignedIds.includes(id)) return this.entityMap.get(parentId)
            }
        }
        return null
    }

    /**
     * Generate a list of all entity values
     * @returns 
     */
    public get values(): T[] {
        if (this.cachedEntities === null) {
            this.cachedEntities = [...this.entityMap.values()]
        }
        return this.cachedEntities
    }

    public get topLevelIds() {
        return this.topLevelIdList
    }

    /**
     * Return hierarchy
     */
    public get childIds(): Map<string, string[]> {
        return this.childIdMap
    }

    // public get entities(): Map<string, T> {
    //     return this.entityMap
    // }

    /**
     * Retrieve the specified entity
     * @param id 
     * @returns 
     */
    public get(id: string): T {
        const result = this.entityMap.get(id)
        if (!result) {
            throw new Error(`Unable to find entry ID ${id}`)
        }
        return result
    }

    /**
     * Return the children of the specified entty
     * @param id 
     * @returns 
     */
    public getChildren(parentId: string): T[] {
        const parent = this.childIdMap.get(parentId)
        return parent ? parent.map((id) => this.get(id)) : []
    }

    /**
     * Utility to set the specified ID to the specified value
     * @param id 
     * @param value
     */
    public set(id: string, value: T) {
        this.entityMap.set(id, value)
        this.cachedEntities = null
    }


    /**
     * Utility to add an entity to storage, optionally before the specified ID
     * @param entity
     * @param asGroup
     * @param targetId
     * @returns 
     */
    public add(
        entity: T,
        asGroup: boolean,
        targetId?: string | null,
    ) {
        this.cachedEntities = null
        this.entityMap.set(entity.id, entity)
        if (asGroup) {
            if (this.childIdMap) {
                this.childIdMap.set(entity.id, [])
            } else {
                this.childIdMap = new Map([[entity.id, []]])
            }
        }
        if (targetId) {
            // Look for matching group or group child
            if (this.childIdMap) {
                for (const [groupId, groupChildIds] of this.childIdMap) {
                    if (targetId === groupId) {
                        groupChildIds.push(entity.id)
                        return
                    } else {
                        let idx = groupChildIds.indexOf(targetId)
                        if (idx !== -1) {
                            groupChildIds.splice(idx + 1, 0, entity.id)
                            return
                        }
                    }
                }
            }

            let idx = this.topLevelIdList.indexOf(targetId)
            if (idx !== -1) {
                this.topLevelIdList.splice(idx, 0, entity.id)
                return
            }
        }
        this.topLevelIdList.push(entity.id)
    }

    /**
     * Utility to locate the index and array of the specified ID in storage
     * @param id 
     * @returns 
     */
    public find(id: string): [number, string[]] {
        let index = this.topLevelIdList.indexOf(id)
        if (index !== -1) {
            return [index, this.topLevelIdList]
        }
        if (this.childIdMap) {
            for (const childList of this.childIdMap.values()) {
                index = childList.indexOf(id)
                if (index !== -1) {
                    return [index, childList]
                }
            }
        }
        throw new Error(`Unable to find entry ID ${id}`)
    }

    /**
     * Utility to delete the specified ID in storage
     * @param id 
     * @returns 
     */
    public remove(id: string): boolean {
        this.cachedEntities = null
        let found = false
        let idx = this.topLevelIdList.indexOf(id)
        if (idx !== -1) {
            this.topLevelIdList.splice(idx, 1)
            found = true
        } else {
            if (this.childIdMap) {
                for (const children of this.childIdMap.values()) {
                    idx = children.indexOf(id)
                    if (idx !== -1) {
                        children.splice(idx, 1)
                        found = true
                        break
                    }
                }
            }
        }

        this.entityMap.delete(id)
        return found
    }

    /**
     * Move an item ID to a different destination
     * @param id 
     * @param destinationID 
     */
    public move<T extends Identifiable>(id: string,
        destinationID: string | null,
        onLowerHalf: boolean | null,
        isSection: boolean | null) {
        this.cachedEntities = null
        const [sourceIndex, sourceList] = this.find(id)

        let destIndex: number
        let destList: string[]

        if (destinationID === null) {
            // If there is no destination ID, then we are moving to the top of the main index list
            destIndex = 0
            destList = this.topLevelIdList
        } else {
            const childIds = this.childIdMap
            const children = childIds?.get(destinationID)

            // If destination is a group, and on the left, then prepend to that group
            if (children && isSection) {
                destIndex = 0
                destList = children
            } else {
                [destIndex, destList] = this.find(destinationID)
                if (onLowerHalf) {
                    destIndex++
                }
            }
        }

        if (destIndex === -1) {
            // Handle appends
            destList.push(id)
            sourceList.splice(sourceIndex, 1)
        } else if (sourceList === destList) {
            // Handle moving within the same list...
            destList.splice(destIndex, 0, id)
            if (sourceIndex < destIndex) {
                destList.splice(sourceIndex, 1)
            } else {
                destList.splice(sourceIndex + 1, 1)
            }
        } else {
            // Handle moving to a differnet list
            destList.splice(destIndex, 0, id)
            sourceList.splice(sourceIndex, 1)
        }
    }
}