export enum VariableSourceType {
    Text = 'TEXT',
    JSON = 'JSON',
    FileJSON = 'FILE-JSON',
    FileCSV = 'FILE-CSV',
}

export interface Variable {
    name: string
    type: VariableSourceType
    value: string
    disabled?: boolean
}
