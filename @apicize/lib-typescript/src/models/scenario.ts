import { Identifiable } from "./identifiable";
import { NameValuePair } from "./name-value-pair";
import { Named } from "./named";

export interface Scenario extends Identifiable, Named {
    variables?: NameValuePair[]
}
