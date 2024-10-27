export { RequestEditor } from './controls/editors/request-editor'
export { RequestGroupEditor } from './controls/editors/request/request-group-editor'
export { AuthorizationEditor } from './controls/editors/authorization-editor'
export { ScenarioEditor } from './controls/editors/scenario-editor'
export { CertificateEditor } from './controls/editors/certificate-editor'
export { ProxyEditor } from './controls/editors/proxy-editor'
export { SettingsEditor } from './controls/editors/settings-editor'
export { CertificateFileType } from './models/workbook/editable-workbook-certificate'
export { Navigation } from './controls/navigation'
export { HelpPanel } from './controls/help'
// Note - don't export store actions, publish method in WorkspaceContext instead, so we can abstract use of redux and other stuff
export { editableWorkspaceToStoredWorkspace as stateToWorkspace, storedWorkspaceToEditableWorkspace, base64Decode, base64Encode } from './services/apicize-serializer'
export { DndContext } from '@dnd-kit/core'
export { EditableEntityType } from './models/workbook/editable-entity-type'

export { useFeedback, FeedbackContext, FeedbackStore, ToastSeverity, ConfirmationOptions } from './contexts/feedback.context'
export { useClipboard, ClipboardContext, ClipboardStore } from './contexts/clipboard.context'
export { useFileOperations, FileOperationsContext, FileOperationsStore, SshFileType } from './contexts/file-operations.context'
export { useWorkspace, WorkspaceContext, WorkspaceStore } from './contexts/workspace.context'
export { useApicizeSettings, ApicizeSettingsContext, ApicizeSettingsStore } from './contexts/apicize-settings.context'

import "./toolkit.css"

declare module '@mui/material/styles' {
    interface Palette {
        navigation: Palette['primary']
        toolbar: Palette['primary']
        folder: Palette['primary']
        request: Palette['primary']
        scenario: Palette['primary']
        authorization: Palette['primary']
        certificate: Palette['primary']
        proxy: Palette['primary']
    }

    interface PaletteOptions {
        navigation?: PaletteOptions['primary']
        toolbar?: PaletteOptions['primary']
        folder?: PaletteOptions['primary']
        request?: PaletteOptions['primary']
        scenario?: PaletteOptions['primary']
        authorization?: PaletteOptions['primary']
        certificate?: PaletteOptions['primary']
        proxy?: PaletteOptions['primary']
    }
}

declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        folder: true
        request: true
        scenario: true
        authorization: true
        certificate: true
        proxy: true
    }
}

declare module '@mui/material/SvgIcon' {
    interface SvgIconPropsColorOverrides {
        folder: true
        request: true
        scenario: true
        authorization: true
        certificate: true
        proxy: true
    }
}