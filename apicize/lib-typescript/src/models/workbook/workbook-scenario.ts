import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { Persisted } from "../persistence";
import { WorkbookNameValuePair } from "./workbook-request";

export interface WorkbookScenario extends Identifiable, Named, Persisted {
    variables?: WorkbookNameValuePair[] 
}
