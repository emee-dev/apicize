import { observer } from "mobx-react-lite"
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { Box, Stack, SvgIcon, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useEffect } from 'react'
import { EditableState } from "../../models/editable";
import { EntityType } from "../../models/workspace/entity-type";
import { useWorkspace, WorkspaceMode } from "../../contexts/workspace.context";
import DefaultsIcon from "../../icons/defaults-icon";
import { ScenarioSection } from "./sections/scenario-scection";
import { AuthorizationSection } from "./sections/authorization-section";
import { CertificateSection } from "./sections/certificate-section";
import { ProxySection } from "./sections/proxy-section";
import { RequestSection } from "./sections/request-section";
import useWindowSize from "../../window-size";
import { useApicize } from "../../contexts/apicize.context";
import { NavFileOpsMenu } from "./nav-file-ops-menu"
import AuthIcon from "../../icons/auth-icon"
import CertificateIcon from "../../icons/certificate-icon"
import RequestIcon from "../../icons/request-icon"
import ScenarioIcon from "../../icons/scenario-icon"
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import { NavOpsMenu } from "./nav-ops-menu"

const PREFERRED_WIDTH = 1200

export const NavigationControl = observer(() => {

    const apicize = useApicize()
    const workspace = useWorkspace()
    const windowSize = useWindowSize()

    useEffect(() => {
        // If window size returns to non-narrow state, and there is a list displayed, go back to "normal"
        if (windowSize.width >= PREFERRED_WIDTH && [WorkspaceMode.RequestList, WorkspaceMode.ScenarioList, WorkspaceMode.AuthorizationList,
        WorkspaceMode.CertificateList, WorkspaceMode.ProxyList].includes(workspace.mode)) {
            workspace.setMode(WorkspaceMode.Normal)
        }
    }, [windowSize])

    const toggleMode = (mode: WorkspaceMode) => {
        workspace.setMode((workspace.mode === mode) ? WorkspaceMode.Normal : mode)
    }

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

    console.log(`Window size width: ${windowSize.width} versus ${PREFERRED_WIDTH}`)
    return (apicize.alwaysHideNavTree || windowSize.width < PREFERRED_WIDTH)
        ? <Box className='navigation-narrow' display='flex'>
            <Stack direction='column' sx={{ flexGrow: 1 }} className='nav-selection-pane' typography='navigation'>
                <ToggleButtonGroup orientation="vertical" value={workspace.mode}>
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
                    <ToggleButton title='Defaults' value={WorkspaceMode.Defaults} onClick={() => toggleMode(WorkspaceMode.Defaults)}>+
                        <SvgIcon color='defaults'>
                            <DefaultsIcon />
                        </SvgIcon>
                    </ToggleButton>
                </ToggleButtonGroup>
                <NavFileOpsMenu orientation='vertical' sx={{ marginTop: '5em' }} />
            </Stack>
            <NavOpsMenu orientation='vertical' sx={{ display: 'flex', alignSelf: 'flex-end', marginLeft: 'auto', alignContent: 'right', gap: '0.2em' }} />
        </Box>
        : <Stack bgcolor='workspace.main' direction='column' useFlexGap gap='0.2em' className='nav-selection-pane' typography='navigation'>
            <Stack direction='row' bgcolor='toolbar.main' padding='0.5em 1em 0.5em 0.5em' minWidth='22em' className='nav-toolbar' fontSize='inherit' typography='navigation'>
                <NavFileOpsMenu orientation='horizontal' sx={{ display: 'flex', typography: 'navigation' }} />
                <NavOpsMenu orientation='horizontal' sx={{ display: 'flex', marginLeft: 'auto', alignContent: 'right', gap: '0.2em', paddingLeft: '2em' }} />
            </Stack>
            <SimpleTreeView
                id='navigation'
                key='navigation'
                aria-label='request navigator'
                // defaultCollapseIcon={<ExpandMoreIcon />}
                // defaultExpandIcon={<ChevronRightIcon />}
                sx={{ paddingRight: '0.8em' }}
                expansionTrigger='iconContainer'
                expandedItems={workspace.expandedItems}
                selectedItems={workspace.activeSelection ? `${workspace.activeSelection.type}-${workspace.activeSelection.id}` : null}
                multiSelect={false}
                onItemExpansionToggle={(_, itemId, isExpanded) => {
                    workspace.updateExpanded(itemId, isExpanded)
                }}
                onSelectedItemsChange={(_, itemId) => {
                    if (itemId) {
                        if (itemId === 'defaults') {
                            workspace.setMode(WorkspaceMode.Defaults)
                        } else {
                            // const i = itemId.indexOf('-')
                            // if (i !== -1) {
                            //     const type = parseInt(itemId.substring(0, i)) as EntityType
                            //     if (type !== EntityType.Header) {
                            //         const id = itemId.substring(i + 1)
                            //         workspace.changeActive(type, id)
                            //     }
                            // }
                        }
                    } else {
                        workspace.clearActive()
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
                            )} onClick={() => workspace.changeActive(EntityType.Warnings, '')} />
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
                                {/* {iconFromState(workspace.defaultsState)} */}
                            </Box>
                        </Box>
                    )} />
            </SimpleTreeView>
        </Stack >
})