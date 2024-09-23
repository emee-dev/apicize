/**
 * Describes how entities are stored
 */
export enum Persistence {
    /**
     * Store entity in global credentials file
     */
    Global = 'GLOBAL',
    /**
     * Store entity in workbook private information file
     */
    Private = 'PRIVATE',
    /**
     * Store entity directly in workbook file
     */
    Workbook = 'WORKBOOK',
}

/**
 * Interface including information on how entity is to be persisted
 */
export interface Persisted {
    persistence: Persistence
}