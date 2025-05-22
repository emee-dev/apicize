import { Selection } from "./selection";

export interface SelectedParameters {
    selectedScenario?: Selection,
    selectedAuthorization?: Selection,
    selectedCertificate?: Selection,
    selectedProxy?: Selection,
    selectedData?: Selection,
}

export interface SelectedParametersWithData extends SelectedParameters {
    selectedData?: Selection
}
