/**
 * Hierarchical structure to store Help Contents in
 */
export type HelpContents = { [name: string]: (string | HelpContents) }