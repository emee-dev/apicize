import { Identifiable } from "@apicize/lib-typescript";

/**
 * Interface to track a hierarchical entitiy
 */
export interface Hierarchical<T> extends Identifiable {
    children?: T[]
}
