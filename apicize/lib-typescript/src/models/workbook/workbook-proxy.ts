import { Identifiable } from "../identifiable";
import { Named } from "../named";
import { Persisted } from "../persistence";

export interface WorkbookProxy extends Identifiable, Named, Persisted {
    url: string
}
