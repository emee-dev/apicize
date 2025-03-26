import { observer } from "mobx-react-lite"
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FileOpenIcon from '@mui/icons-material/FileOpen'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SaveIcon from '@mui/icons-material/Save'
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveAsIcon from '@mui/icons-material/SaveAs'
import HelpIcon from '@mui/icons-material/Help'
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { Box, IconButton, MenuItem, Stack, SvgIcon, ToggleButton, ToggleButtonGroup } from '@mui/material'
import React, { useEffect } from 'react'
import { EditableState } from "../../models/editable";
import { EditableEntityType } from "../../models/workspace/editable-entity-type";
import { useFileOperations } from "../../contexts/file-operations.context";
import { useWorkspace, WorkspaceMode } from "../../contexts/workspace.context";
import { ToastSeverity, useFeedback } from "../../contexts/feedback.context";
import DefaultsIcon from "../../icons/defaults-icon";
import LogIcon from "../../icons/log-icon";
import { DropdownMenu } from "./dropdown-menu";
import { ScenarioSection } from "./sections/scenario-scection";
import { AuthorizationSection } from "./sections/authorization-section";
import { CertificateSection } from "./sections/certificate-section";
import { ProxySection } from "./sections/proxy-section";
import { RequestSection } from "./sections/request-section";
import useWindowSize from "../../window-size";
import { NarrowNavigation } from "./narrow-navigation";
import { useWorkspaceSession } from "../../contexts/workspace-session.context";
import { useApicize } from "../../contexts/apicize.context";

const PREFERRED_WIDTH = 1200

export const Navigation = observer(() => {

    const apicize = useApicize()
    const workspace = useWorkspace()
    const session = useWorkspaceSession()
    const windowSize = useWindowSize()
    const fileOps = useFileOperations()
    const feedback = useFeedback()

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

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

    window.onkeydown = ((e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'Enter':
                    (async () => {
                        try {
                            if (!(session.active && (session.active.entityType === EditableEntityType.Request || session.active.entityType === EditableEntityType.Group))) {
                                return
                            }
                            await workspace.executeRequest(session.active.id, !e.shiftKey)
                        } catch (e) {
                            let msg1 = `${e}`
                            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
                        }
                    })()
                    break
                case 'n':
                    fileOps.newWorkbook()
                    break
                // case 'O':
                //     TODO - need to work on making recent file drop down keyboard-friendly
                //     handleFileMenuClick()
                //     break
                case 'o':
                    if (e.shiftKey) {
                        handleFileMenuClick()
                    } else {
                        fileOps.openWorkbook()
                    }
                    break
                case 's':
                    if (e.shiftKey) {
                        fileOps.saveWorkbookAs()
                    } else {
                        fileOps.saveWorkbook()
                    }
                    break
            }
        }
    })

    const iconFromState = (state: EditableState) => {
        switch (state) {
            case EditableState.Running:
                return <PlayArrowIcon color="success" />
            case EditableState.Warning:
                return <WarningAmberIcon color="warning" />
            default:
                return null
        }
    }


    useEffect(() => {
        // If window size returns to non-narrow state, and there is a list displayed, go back to "normal"
        if (windowSize.width >= PREFERRED_WIDTH && [WorkspaceMode.RequestList, WorkspaceMode.ScenarioList, WorkspaceMode.AuthorizationList,
        WorkspaceMode.CertificateList, WorkspaceMode.ProxyList].includes(session.mode)) {
            workspace.setMode(WorkspaceMode.Normal)
        }
    }, [windowSize])


    return (apicize.alwaysHideNavTree || windowSize.width < PREFERRED_WIDTH)
        ? <NarrowNavigation />
        : <Stack bgcolor='session.main' direction='column' useFlexGap gap='0.2em' className='nav-selection-pane'  typography='navigation'>
            <Stack direction='row' bgcolor='toolbar.main' padding='0.5em 1em 0.5em 0.5em' minWidth='22em' className='nav-toolbar' fontSize='inherit' typography='navigation'>
                <Stack direction='row' useFlexGap gap='0.2em' typography='navigation'>
                    <IconButton aria-label='new' title={`New Workbook (${apicize.ctrlKey} + N)`} onClick={() => fileOps.newWorkbook()} sx={{fontSize: 'inherit'}}>
                        <PostAddIcon />
                    </IconButton>
                    <IconButton aria-label='open' sx={{ fontSize: apicize.navigationFontSize }} title={`Open Workbook (${apicize.ctrlKey} + O)`} onClick={() => fileOps.openWorkbook(undefined, true)}>
                        <FileOpenIcon />
                    </IconButton>
                    {
                        apicize.recentWorkbookFileNames.length > 1
                            ? <IconButton
                                id='file-menu-button'
                                title='Open Recent Workbook'
                                sx={{ padding: 0, minWidth: '1em', width: '1em', marginLeft: '-0.3em' }}
                                onClick={handleFileMenuClick}
                            ><KeyboardArrowDownIcon />
                            </IconButton>
                            : null
                    }
                    {
                        apicize.recentWorkbookFileNames.length > 1
                            ? <DropdownMenu
                                id="file-menu"
                                autoFocus
                                slotProps={{
                                    list: {
                                        'aria-labelledby': 'file-menu-button',
                                    }
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
                    <IconButton aria-label='save' sx={{ fontSize: apicize.navigationFontSize }} title={`Save Workbook (${apicize.ctrlKey} + S)`} disabled={workspace.workbookFullName.length == 0} onClick={() => fileOps.saveWorkbook()}>
                        <SaveIcon />
                    </IconButton>
                    <IconButton aria-label='save-as' sx={{ fontSize: apicize.navigationFontSize }} title={`Save Workbook As (${apicize.ctrlKey} + Shift + S)`} onClick={() => fileOps.saveWorkbookAs()}>
                        <SaveAsIcon />
                    </IconButton>
                </Stack>
                <ToggleButtonGroup orientation="horizontal" value={session.mode} sx={{ display: 'flex', alignSelf: 'flex-end', marginLeft: 'auto', alignContent: 'right', gap: '0.2em', paddingLeft: '2em' }}>
                    <ToggleButton title='Settings' value={WorkspaceMode.Settings} sx={{ border: 'none', fontSize: apicize.navigationFontSize, padding: '8px', paddingInline: '8px', paddingBlock: '8px' }} onClick={() => workspace.setMode(WorkspaceMode.Settings)}>
                        <SettingsIcon />
                    </ToggleButton>
                    <ToggleButton title='Communication Logs' value={WorkspaceMode.Console} sx={{ border: 'none', fontSize: apicize.navigationFontSize, padding: '8px', paddingInline: '8px', paddingBlock: '8px' }} onClick={() => { workspace.setMode(WorkspaceMode.Console) }}>
                        <SvgIcon><LogIcon /></SvgIcon>
                    </ToggleButton>
                    <ToggleButton title='Help' value={WorkspaceMode.Help} sx={{ border: 'none', fontSize: apicize.navigationFontSize, padding: '8px', paddingInline: '8px', paddingBlock: '8px' }} onClick={() => { session.showNextHelpTopic() }}>
                        <SvgIcon><HelpIcon /></SvgIcon>
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <SimpleTreeView
                id='navigation'
                key='navigation'
                aria-label='request navigator'
                // defaultCollapseIcon={<ExpandMoreIcon />}
                // defaultExpandIcon={<ChevronRightIcon />}
                sx={{ paddingRight: '0.8em' }}
                expansionTrigger='iconContainer'
                expandedItems={session.expandedItems}
                selectedItems={session.activeId}
                multiSelect={false}
                onItemExpansionToggle={(_, itemId, isExpanded) => {
                    session.updateExpanded(itemId, isExpanded)
                }}
                onSelectedItemsChange={(_, itemId) => {
                    if (itemId) {
                        if (itemId === 'defaults') {
                            workspace.setMode(WorkspaceMode.Defaults)
                        } else {
                            const i = itemId.indexOf('-')
                            if (i !== -1) {
                                const type = itemId.substring(0, i) as EditableEntityType
                                if (type !== EditableEntityType.Header) {
                                    const id = itemId.substring(i + 1)
                                    session.changeActive(type, id)
                                }
                            }
                        }
                    } else {
                        session.clearAllActive()
                    }
                }}
                className='navigation-tree'
            >
                {
                    workspace.warnings.hasEntries
                        ? <TreeItem
                            itemId="wkbk-warnings"
                            sx={{ margin: '0.5em 0 1.0em 0', padding: 0 }}
                            label={(
                                <Box
                                    component='span'
                                    display='flex'
                                    justifyContent='space-between'
                                    alignItems='center'
                                >
                                    <Box className='nav-icon-box'>
                                        <SvgIcon color='warning' fontSize='small'><WarningAmberIcon /></SvgIcon>
                                    </Box>
                                    <Box className='nav-node-text' display='flex' flexGrow={1} alignItems='center'>
                                        Warnings
                                    </Box>
                                </Box>
                            )} onClick={() => session.changeActive(EditableEntityType.Warnings, '')} />
                        : null
                }

                <RequestSection includeHeader={true} />
                <ScenarioSection includeHeader={true} />
                <AuthorizationSection includeHeader={true} />
                <CertificateSection includeHeader={true} />
                <ProxySection includeHeader={true} />
                <TreeItem
                    itemId="defaults"
                    sx={{ margin: '1.0em 0 1.0em 0', padding: 0 }}
                    label={(
                        <Box
                            className='nav-item'
                            typography='navigation'
                        >
                            <Box className='nav-icon-box'>
                                <SvgIcon color='defaults'><DefaultsIcon /></SvgIcon>
                            </Box>
                            <Box className='nav-node-text' display='flex' flexGrow={1} alignItems='center'>
                                Defaults
                            </Box>
                            <Box display='inline-flex' width='2em' paddingLeft='1em' justifyItems='center' justifyContent='left'>
                                {iconFromState(workspace.defaultsState)}
                            </Box>
                        </Box>
                    )} />
            </SimpleTreeView>
        </Stack >
})
