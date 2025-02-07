export { RequestEditor } from './controls/editors/request-editor'
export { RequestGroupEditor } from './controls/editors/request/request-group-editor'
export { AuthorizationEditor } from './controls/editors/authorization-editor'
export { ScenarioEditor } from './controls/editors/scenario-editor'
export { CertificateEditor } from './controls/editors/certificate-editor'
export { ProxyEditor } from './controls/editors/proxy-editor'
export { SettingsEditor } from './controls/editors/settings-editor'
export { DefaultsEditor } from './controls/editors/defaults-editor'
export { WarningsEditor } from './controls/editors/warnings-editor'
export { EditableAuthorization } from './models/workspace/editable-authorization'
export { CertificateFileType } from './models/workspace/editable-certificate'
export { Navigation } from './controls/navigation'
export { HelpPanel } from './controls/help'
export { MainPanel } from './controls/main-panel'

// Note - don't export store actions, publish method in WorkspaceContext instead, so we can abstract use of redux and other stuff
export { editableWorkspaceToStoredWorkspace, base64Decode, base64Encode } from './services/apicize-serializer'
export { DndContext } from '@dnd-kit/core'
export { EditableEntityType } from './models/workspace/editable-entity-type'

export { useFeedback, FeedbackContext, FeedbackStore, ToastSeverity, ConfirmationOptions } from './contexts/feedback.context'
export { useClipboard, ClipboardContext, ClipboardStore } from './contexts/clipboard.context'
export { useFileOperations, FileOperationsContext, FileOperationsStore, SshFileType } from './contexts/file-operations.context'
export { usePkce, PkceContext } from './contexts/pkce.context'
export { useWorkspace, WorkspaceContext, WorkspaceStore } from './contexts/workspace.context'
export { useApicizeSettings, ApicizeSettingsContext } from './contexts/apicize-settings.context'
export { ApicizeSettings } from './models/settings'

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
        defaults: Palette['primary']
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
        public?: PaletteOptions['primary']
        private?: PaletteOptions['primary']
        vault?: PaletteOptions['primary']
        defaults?: PaletteOptions['primary']
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
        public: true
        private: true
        vault: true
    }
}

declare module '@mui/material/SvgIcon' {
    interface SvgIconPropsColorOverrides {
        folder: true
        request: true
        scenario: true
        authorization: true
        certificate: true
        proxy: true,
        public: true
        private: true
        vault: true
        defaults: true
    }
}