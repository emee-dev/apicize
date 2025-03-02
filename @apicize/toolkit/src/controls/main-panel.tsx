import { Box, Drawer, IconButton, Stack, ToggleButton } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Navigation } from "./navigation";
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
import { useEffect, useState } from "react";
import useWindowSize from "../window-size";
import MenuIcon from '@mui/icons-material/Menu';

const PREFERRED_WIDTH = 1200

export const MainPanel = observer(() => {
    const workspace = useWorkspace()
    let mainPane

    const windowSize = useWindowSize()
    const [showDrawer, setShowDrawer] = useState(windowSize.width < PREFERRED_WIDTH &&
        (workspace.active?.entityType === undefined || workspace.mode === WorkspaceMode.Normal)
    )


    switch (workspace.mode) {
        case WorkspaceMode.Help:
            mainPane = <HelpPanel sx={{ display: 'block', flexGrow: 1 }} />
            break
        case WorkspaceMode.Settings:
            mainPane = <SettingsEditor sx={{ display: 'block', flexGrow: 1 }} />
            break
        case WorkspaceMode.Console:
            mainPane = <LogViewer sx={{ display: 'block', flexGrow: 1 }} />
            break
        case WorkspaceMode.Defaults:
            mainPane = <DefaultsEditor sx={{ display: 'block', flexGrow: 1 }} />
            break
        default:
            switch (workspace.active?.entityType) {
                case EditableEntityType.Request:
                case EditableEntityType.Group:
                    mainPane = <RequestEditor sx={{ display: 'block', flexGrow: 1 }} />
                    break
                case EditableEntityType.Scenario:
                    mainPane = <ScenarioEditor sx={{ display: 'block', flexGrow: 1 }} />
                    break
                case EditableEntityType.Authorization:
                    mainPane = <AuthorizationEditor sx={{ display: 'block', flexGrow: 1 }} />
                    break
                case EditableEntityType.Certificate:
                    mainPane = <CertificateEditor sx={{ display: 'block', flexGrow: 1 }} />
                    break
                case EditableEntityType.Proxy:
                    mainPane = <ProxyEditor sx={{ display: 'block', flexGrow: 1 }} />
                    break
                case EditableEntityType.Warnings:
                    mainPane = <WarningsEditor sx={{ display: 'block', flexGrow: 1 }} />
                    break
                default:
                    mainPane = <></>
            }
    }

    useEffect(() => {
        if (showDrawer) {
            if (workspace.active?.entityType !== undefined || workspace.mode !== WorkspaceMode.Normal) {
                setShowDrawer(false)
            }
        } else {
            if (workspace.active?.entityType === undefined || workspace.mode === WorkspaceMode.Normal) {
                setShowDrawer(true)
            }
        }
    }, [windowSize, workspace.active, workspace.mode])


    return <Stack direction='row' sx={{ width: '100%', height: '100vh', display: 'flex', padding: '0' }}>
        {
            windowSize.width < PREFERRED_WIDTH
                ? <>
                    <Box sx={{ top: 0, left: 0, height: '100%', width: '3rem' }}>
                        <ToggleButton value={!showDrawer} color='primary' onClick={() => setShowDrawer(true)}
                            sx={{ display: showDrawer ? 'none' : 'block', position: 'absolute', left: '0', top: '0.5rem' }}>
                            <MenuIcon color='primary' />
                        </ToggleButton>
                    </Box>
                    <Drawer
                        variant='temporary'
                        open={showDrawer}
                        anchor='left'
                        onClose={() => setShowDrawer(false)}
                    >
                        <Navigation />
                    </Drawer>
                </>
                : <Navigation />
        }
        {mainPane}
    </Stack>

})
