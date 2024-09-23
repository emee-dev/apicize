/**
 * Interface that expresses how we identify things (name)
 */
export interface Named {
    name?: string
}

/**
 * Get an entity's name
 * @param entity Identifiable entity
 * @returns Name if set or "(Unnamed)" if not set
 */
export function GetTitle(entity?: Named): string {
    return (entity?.name && entity.name.length  > 0) ? entity.name : '(Unnamed)'
}
