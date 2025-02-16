import { Identifiable } from "./identifiable";
import { Named } from "./named";

export enum ScenarioVariableType {
    Text = 'TEXT',
    JSON = 'JSON',
    FileJSON = 'FILE-JSON',
    FileCSV = 'FILE-CSV',
}

export interface ScenarioVariable {
    name: string
    type: ScenarioVariableType
    value: string
    disabled?: boolean
}

export interface Scenario extends Identifiable, Named {
    variables?: ScenarioVariable[]
}
