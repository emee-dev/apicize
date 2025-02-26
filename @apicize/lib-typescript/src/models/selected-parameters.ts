import { Selection } from "./selection";
import { Variable } from "./variable";

export interface SelectedParameters {
    selectedScenario?: Selection,
    selectedAuthorization?: Selection,
    selectedCertificate?: Selection,
    selectedProxy?: Selection,
    selectedData?: Selection,
}