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
import { EntityType } from "../models/workspace/entity-type";
import { LogViewer } from "./viewers/log-viewer";
import { RequestList } from "./navigation/lists/request-list";
import { ScenarioList } from "./navigation/lists/scenario-list";
import { AuthorizationList } from "./navigation/lists/authorization-list";
import { CertificateList } from "./navigation/lists/certificate-list";
import { ProxyList } from "./navigation/lists/proxy-list";
import { NavigationControl } from "./navigation/navigation";
import { RequestGroupEditor } from "./editors/request-group-editor";
import { reaction } from "mobx";
import { useApicizeSettings } from "../contexts/apicize-settings.context";
import { ToastSeverity, useFeedback } from "../contexts/feedback.context";
import { useFileOperations } from "../contexts/file-operations.context";

export const MainPanel = observer(() => {
    const workspace = useWorkspace()
    const settings = useApicizeSettings()
    const fileOps = useFileOperations()
    const feedback = useFeedback()

    const mode = workspace.mode
    const activeSelection = workspace.activeSelection

    let lastPendingChangeCtr = 0

    const checkSave = (pendingChangeCtr: number) => {
        // Only save if the save ctr hasn't changed in the specified interval
        setTimeout(async () => {
            if (lastPendingChangeCtr === pendingChangeCtr && lastPendingChangeCtr !== 0) {
                try {
                    lastPendingChangeCtr = 0
                    settings.clearPendingChanges()
                    await fileOps.saveSettings()
                } catch (e) {
                    feedback.toast(`Unable to save Settings - ${e}`, ToastSeverity.Error)
                }
            } else {
                if (pendingChangeCtr > lastPendingChangeCtr) {
                    lastPendingChangeCtr = pendingChangeCtr
                    setTimeout(() => {
                        checkSave(pendingChangeCtr)
                    }, 250)
                }
            }
        }, 250)
    }

    reaction(
        () => settings.pendingChangeCtr,
        pendingChangeCtr => {
            checkSave(pendingChangeCtr)
        }
    )

    const Pane = (() => {
        switch (mode) {
            case WorkspaceMode.Help:
                return <HelpPanel sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.Settings:
                return <SettingsEditor sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.Console:
                return <LogViewer />
            // case WorkspaceMode.Warnings:
            //     return <WarningsEditor sx={{ display: 'block', flexGrow: 1 }} />
            case WorkspaceMode.Defaults:
                return <DefaultsEditor sx={{ display: 'block', flexGrow: 1 }} />
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
                if (activeSelection) {
                    switch (activeSelection.type) {
                        case EntityType.Request:
                            return <RequestEditor sx={{ display: 'block', flexGrow: 1 }} />
                        case EntityType.Group:
                            return <RequestGroupEditor sx={{ display: 'block', flexGrow: 1 }} />
                        case EntityType.Scenario:
                            return <ScenarioEditor sx={{ display: 'block', flexGrow: 1 }} />
                        case EntityType.Authorization:
                            return <AuthorizationEditor sx={{ display: 'block', flexGrow: 1 }} />
                        case EntityType.Certificate:
                            return <CertificateEditor sx={{ display: 'block', flexGrow: 1 }} />
                        case EntityType.Proxy:
                            return <ProxyEditor sx={{ display: 'block', flexGrow: 1 }} />
                        default:
                            return <></>
                    }
                } else {
                    return <></>
                }
        }
    })

    return <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', padding: '0' }}>
        <NavigationControl />
        <Pane />
    </Stack>
})
