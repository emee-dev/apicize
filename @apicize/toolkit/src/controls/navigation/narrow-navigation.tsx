import { ToggleButtonGroup, ToggleButton, SvgIcon, Stack, IconButton, MenuItem } from "@mui/material";
import { Box, SxProps } from "@mui/system";
import { observer } from "mobx-react-lite";
import { useWorkspace, WorkspaceMode } from "../../contexts/workspace.context";
import RequestIcon from "../../icons/request-icon";
import ScenarioIcon from "../../icons/scenario-icon";
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import AuthIcon from "../../icons/auth-icon";
import CertificateIcon from "../../icons/certificate-icon";
import DefaultsIcon from "../../icons/defaults-icon";
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help'
import LogIcon from "../../icons/log-icon";
import FileOpenIcon from '@mui/icons-material/FileOpen'
import SaveIcon from '@mui/icons-material/Save'
import SaveAsIcon from '@mui/icons-material/SaveAs'
import PostAddIcon from '@mui/icons-material/PostAdd'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { DropdownMenu } from "./dropdown-menu";
import { useFileOperations } from "../../contexts/file-operations.context";
import { useState } from "react";
import { useApicize } from "../../contexts/apicize.context";
import { useWorkspaceSession } from "../../contexts/workspace-session.context";

export const NarrowNavigation = observer((props: { sx?: SxProps }) => {
    const workspace = useWorkspace()
    const session = useWorkspaceSession()
    const fileOps = useFileOperations()
    const apicize = useApicize()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    const fileMenuOpen = Boolean(anchorEl);
    const handleFileMenuClick = () => {
        const target = document.getElementById('file-menu-button')
        setAnchorEl(target);
        document.getElementById('nav-file-0')?.focus()
    };
    const handleFileOpen = (fileName: string) => {
        setAnchorEl(null);
        fileOps.openWorkbook(fileName)
    }
    const handleFileMenuClose = () => {
        setAnchorEl(null);
    };

    const toggleMode = (mode: WorkspaceMode) => {
        session.setMode((session.mode === mode) ? WorkspaceMode.Normal : mode)
    }

    return <Box className='navigation-narrow' sx={props.sx}>
        <ToggleButtonGroup orientation="vertical" value={session.mode}>
            <ToggleButton title='Requests and Groups' value={WorkspaceMode.RequestList} onClick={() => toggleMode(WorkspaceMode.RequestList)}>
                <SvgIcon color='request'>
                    <RequestIcon />
                </SvgIcon>
            </ToggleButton>
            <ToggleButton title='Scenarios' value={WorkspaceMode.ScenarioList} onClick={() => toggleMode(WorkspaceMode.ScenarioList)}>
                <SvgIcon color='scenario'>
                    <ScenarioIcon />
                </SvgIcon>
            </ToggleButton>
            <ToggleButton title='Authorizations' value={WorkspaceMode.AuthorizationList} onClick={() => toggleMode(WorkspaceMode.AuthorizationList)}>
                <SvgIcon color='authorization'>
                    <AuthIcon />
                </SvgIcon>
            </ToggleButton>
            <ToggleButton title='Certificates' value={WorkspaceMode.CertificateList} onClick={() => toggleMode(WorkspaceMode.CertificateList)}>
                <SvgIcon color='certificate'>
                    <CertificateIcon />
                </SvgIcon>
            </ToggleButton>
            <ToggleButton title='Proxies' value={WorkspaceMode.ProxyList} onClick={() => toggleMode(WorkspaceMode.ProxyList)}>
                <SvgIcon color='proxy'>
                    <AirlineStopsIcon />
                </SvgIcon>
            </ToggleButton>
            <ToggleButton title='Defaults' value={WorkspaceMode.Defaults} onClick={() => toggleMode(WorkspaceMode.Defaults)}>
                <SvgIcon color='defaults'>
                    <DefaultsIcon />
                </SvgIcon>
            </ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} flexGrow={1}>
            <ToggleButton value='file-new' aria-label='new' title='New Workbook (Ctrl + N)' onClick={() => fileOps.newWorkbook()}>
                <PostAddIcon />
            </ToggleButton>
            <ToggleButton value='file-open' aria-label='open' title='Open Workbook (Ctrl + O)' onClick={() => fileOps.openWorkbook(undefined, true)}>
                <Stack direction='column' sx={{ display: 'flex', alignItems: 'center' }}>
                    <FileOpenIcon />

                </Stack>
            </ToggleButton>
            {
                apicize.recentWorkbookFileNames.length > 1
                    ? <ToggleButton
                        value='file-menu'
                        id='file-menu-button'
                        title='Open Recent Workbook'
                        sx={{ display: 'block', padding: '0 4px', height: '24px', borderRadius: 0 }}
                        // sx={{ padding: 0, minWidth: '1em', width: '1em', top: '-4px', right: '-18px' }}
                        onClick={handleFileMenuClick}
                    ><KeyboardArrowDownIcon />
                    </ToggleButton>
                    : null
            }
            {
                apicize.recentWorkbookFileNames.length > 1
                    ? <DropdownMenu
                        id="file-menu"
                        autoFocus
                        MenuListProps={{
                            'aria-labelledby': 'file-menu-button',
                        }}
                        anchorEl={anchorEl}
                        open={fileMenuOpen}
                        onClose={handleFileMenuClose}
                    >
                        {
                            apicize.recentWorkbookFileNames.map((f, idx) => (
                                <MenuItem autoFocus={idx == 0} key={`nav-file-${idx}`} onClick={() => handleFileOpen(f)} disableRipple>
                                    {`${idx + 1}) ${f}`}
                                </MenuItem>
                            ))
                        }
                    </DropdownMenu>
                    : null
            }
            <ToggleButton value='file-save' aria-label='save' title='Save Workbook (Ctrl + S)' disabled={workspace.workbookFullName.length == 0} onClick={() => fileOps.saveWorkbook()}>
                <SaveIcon />
            </ToggleButton>
            <ToggleButton value='file-save-as' aria-label='save-as' title='Save Workbook As (Ctrl + Shift + S)' onClick={() => fileOps.saveWorkbookAs()}>
                <SaveAsIcon />
            </ToggleButton>


        </Box>
        <ToggleButtonGroup orientation="vertical" value={session.mode}>
            <ToggleButton title='Settings' value={WorkspaceMode.Settings} onClick={() => toggleMode(WorkspaceMode.Settings)}>
                <SvgIcon>
                    <SettingsIcon />
                </SvgIcon>
            </ToggleButton>
            <ToggleButton title='Communication Logs' value={WorkspaceMode.Console} onClick={() => { toggleMode(WorkspaceMode.Console) }}>
                <SvgIcon><LogIcon /></SvgIcon>
            </ToggleButton>
            <ToggleButton title='Help' value={WorkspaceMode.Help} onClick={() => (session.mode === WorkspaceMode.Help)
                ? session.setMode(WorkspaceMode.Normal) : session.showNextHelpTopic()}>
                <SvgIcon><HelpIcon /></SvgIcon>
            </ToggleButton>
        </ToggleButtonGroup>
    </Box>
})