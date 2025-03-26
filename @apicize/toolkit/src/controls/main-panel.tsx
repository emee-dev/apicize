import { Stack } from "@mui/material";
import { observer } from "mobx-react-lite";
import { HelpPanel } from "./help";
import { RequestEditor } from "./editors/request-editor";
import { ScenarioEditor } from "./editors/scenario-editor";
import { AuthorizationEditor } from "./editors/authorization-editor";
import { CertificateEditor } from "./editors/certificate-editor";
import { ProxyEditor } from "./editors/proxy-editor";
import { SettingsEditor } from "./editors/settings-editor";
import { DefaultsEditor } from "./editors/defaults-editor";
import { WarningsEditor } from "./editors/warnings-editor";
import { useWorkspace, WorkspaceMode } from "../contexts/workspace.context";
import { EditableEntityType } from "../models/workspace/editable-entity-type";
import { LogViewer } from "./viewers/log-viewer";
import { RequestList } from "./navigation/lists/request-list";
import { ScenarioList } from "./navigation/lists/scenario-list";
import { AuthorizationList } from "./navigation/lists/authorization-list";
import { CertificateList } from "./navigation/lists/certificate-list";
import { ProxyList } from "./navigation/lists/proxy-list";
import { WorkspaceSessionProvider, useWorkspaceSession } from "../contexts/workspace-session.context";
import { useRef } from "react";
import { Navigation } from "./navigation/navigation";

export const MainPanel = observer(() => {
    const workspace = useWorkspace()

    const session = useRef(workspace.addSession())

    const Pane = observer(() => {
        switch (session.current.mode) {
            case WorkspaceMode.Help:
                return <HelpPanel sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.Settings:
                return <SettingsEditor sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.Console:
                return <LogViewer sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.Warnings:
                return <WarningsEditor sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.Defaults:
            case WorkspaceMode.Seed:
                return <DefaultsEditor sx={{ display: 'block', flexGrow: 1 }} defaults={workspace.defaults} externalData={workspace.externalData} />
            case WorkspaceMode.RequestList:
                return <RequestList sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.ScenarioList:
                return <ScenarioList sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.AuthorizationList:
                return <AuthorizationList sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.CertificateList:
                return <CertificateList sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.ProxyList:
                return <ProxyList sx={{ display: 'block', flexGrow: 1 }} />
            default:
                switch (session.current.active?.entityType) {
                    case EditableEntityType.Request:
                    case EditableEntityType.Group:
                        return <RequestEditor sx={{ display: 'block', flexGrow: 1 }} request={session.current.active} />
                    case EditableEntityType.Scenario:
                        return <ScenarioEditor sx={{ display: 'block', flexGrow: 1 }} scenario={session.current.active} />
                    case EditableEntityType.Authorization:
                        return <AuthorizationEditor sx={{ display: 'block', flexGrow: 1 }} authorization={session.current.active} />
                    case EditableEntityType.Certificate:
                        return <CertificateEditor sx={{ display: 'block', flexGrow: 1 }} certificate={session.current.active} />
                    case EditableEntityType.Proxy:
                        return <ProxyEditor sx={{ display: 'block', flexGrow: 1 }} proxy={session.current.active} />
                    default:
                        return <></>
                }
        }
    })


    return <WorkspaceSessionProvider navigation={session.current}>
        <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', padding: '0' }}>
            <Navigation />
            <Pane />
        </Stack>
    </WorkspaceSessionProvider >
})
