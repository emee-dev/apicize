import { Identifiable } from "@apicize/lib-typescript"
import { action, computed, observable } from "mobx"

export class IndexedEntityManager<T extends Identifiable> {
    @observable accessor entities: Map<string, T>
    @observable accessor topLevelIds: string[]
    @observable accessor childIds: Map<string, string[]>

    public constructor(
        entityMap: Map<string, T>,
        topLevelIdList: string[],
        childIdMap: Map<string, string[]>,
    ) {
        this.entities = entityMap
        this.topLevelIds = topLevelIdList
        this.childIds = childIdMap
    }

    /**
     * Clear all stored entries
     */
    public reset() {
        this.entities = new Map()
        this.topLevelIds = []
    }

    /**
     * Find the parent, if any, of the specified ID
     * @param id 
     * @returns 
     */
    public findParent(id: string | null) {
        if (id) {
            for (const [parentId, assignedIds] of this.childIds) {
                if (assignedIds.includes(id)) return this.entities.get(parentId)
            }
        }
        return null
    }

    /**
     * Generate a list of all entity values
     * @returns 
     */
    @computed
    public get values(): T[] {
        return [...this.entities.values()]
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
        const result = this.entities.get(id)
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
        const parent = this.childIds.get(parentId)
        return parent ? parent.map((id) => this.get(id)) : []
    }

    /**
     * Utility to set the specified ID to the specified value
     * @param id 
     * @param value
     */
    @action
    public set(id: string, value: T) {
        this.entities.set(id, value)
    }

    /**
     * Utility to add an entity to storage, optionally before the specified ID
     * @param entity
     * @param asGroup
     * @param targetId
     * @returns 
     */
    @action
    public add(
        entity: T,
        asGroup: boolean,
        targetId?: string | null,
    ) {
        this.entities.set(entity.id, entity)
        if (asGroup) {
            if (this.childIds) {
                this.childIds.set(entity.id, [])
            } else {
                this.childIds = new Map([[entity.id, []]])
            }
        }
        if (targetId) {
            // Look for matching group or group child
            if (this.childIds) {
                for (const [groupId, groupChildIds] of this.childIds) {
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

            let idx = this.topLevelIds.indexOf(targetId)
            if (idx !== -1) {
                this.topLevelIds.splice(idx, 0, entity.id)
                return
            }
        }
        this.topLevelIds.push(entity.id)
    }

    /**
     * Utility to locate the index and array of the specified ID in storage
     * @param id 
     * @returns 
     */
    public find(id: string): [number, string[]] {
        let index = this.topLevelIds.indexOf(id)
        if (index !== -1) {
            return [index, this.topLevelIds]
        }
        if (this.childIds) {
            for (const childList of this.childIds.values()) {
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
    @action
    public remove(id: string): boolean {
        let found = false
        let idx = this.topLevelIds.indexOf(id)
        if (idx !== -1) {
            this.topLevelIds.splice(idx, 1)
            found = true
        } else {
            if (this.childIds) {
                for (const children of this.childIds.values()) {
                    idx = children.indexOf(id)
                    if (idx !== -1) {
                        children.splice(idx, 1)
                        found = true
                        break
                    }
                }
            }
        }

        this.entities.delete(id)
        return found
    }

    /**
     * Move an item ID to a different destination
     * @param id 
     * @param destinationID 
     */
    @action
    public move<T extends Identifiable>(id: string,
        destinationID: string | null,
        onLowerHalf: boolean | null,
        isSection: boolean | null) {
        const [sourceIndex, sourceList] = this.find(id)

        let destIndex: number
        let destList: string[]

        if (destinationID === null) {
            // If there is no destination ID, then we are moving to the top of the main index list
            destIndex = 0
            destList = this.topLevelIds
        } else {
            const childIds = this.childIds
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