import { Selection } from "./selection";
import { Warnings } from "./warnings";

export interface SelectedParameters {
    selectedScenario?: Selection,
    selectedAuthorization?: Selection,
    selectedCertificate?: Selection,
    selectedProxy?: Selection,
    selectedData?: Selection,
}

export interface WorkspaceDefaultParameters extends SelectedParameters, Warnings {
    selectedData?: Selection
}
