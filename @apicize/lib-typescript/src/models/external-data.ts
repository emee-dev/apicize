import { Identifiable } from "./identifiable"
import { Named } from "./named"

export enum ExternalDataSourceType {
    JSON = 'JSON',
    FileJSON = 'FILE-JSON',
    FileCSV = 'FILE-CSV',
}

export interface ExternalData extends Identifiable, Named {
    id: string
    name: string
    type: ExternalDataSourceType
    source: string
}
