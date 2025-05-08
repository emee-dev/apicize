import * as React from 'react'
import { ToggleButtonGroup, ToggleButton, Box, Stack, SxProps, SvgIcon } from '@mui/material'
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import FolderIcon from '../../icons/folder-icon'
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AltRouteIcon from '@mui/icons-material/AltRoute'
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { ResultsViewer } from '../viewers/results-viewer'
import { EditorTitle } from '../editor-title';
import { RequestParametersEditor } from './request/request-parameters-editor';
import { observer } from 'mobx-react-lite';
import { EditableRequestGroup } from '../../models/workspace/editable-request-group';
import { RunToolbar } from '../run-toolbar';
import { useWorkspace } from '../../contexts/workspace.context';
import { RequestWarningsEditor } from './request/request-warnings.editor';
import { RunResultsToolbar } from '../run-results-toolbar';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useFileOperations } from '../../contexts/file-operations.context';
import { useApicize } from '../../contexts/apicize.context'
import { RequestGroupInfoEditor } from './request/request-group-info-editor';

type RequestPanel = 'Info' | 'Headers' | 'Query String' | 'Body' | 'Test' | 'Parameters' | 'Warnings'

export const RequestGroupEditor = observer((props: { sx?: SxProps }) => {
    const apicize = useApicize()
    const fileOps = useFileOperations()

    const workspace = useWorkspace()
    const activeSelection = workspace.activeSelection

    if (!activeSelection?.group) {
        return null
    }

    workspace.nextHelpTopic = 'workspace/groups'

    const group = activeSelection.group
    const execution = workspace.getExecution(group.id)

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: RequestPanel) => {
        if (newValue) {
            workspace.changeRequestPanel(newValue)
        }
    }

    const isRunning = execution.isRunning

    let usePanel = workspace.requestPanel

    let hasWarnings = (group?.warnings?.size ?? 0) > 0

    if (usePanel === 'Warnings') {
        const warnings = group.warnings
        // If user cleared warnings, switch to Parameters
        if (!hasWarnings) {
            usePanel = 'Info'
        }
    } else if (usePanel !== 'Info' && usePanel !== 'Parameters') {
        usePanel = 'Info'
    }

    let lastResize = Date.now()
    const saveIfSettled = () => {
        if (Date.now() - lastResize > 500) {
            fileOps.saveSettings()
        } else {
            setTimeout(saveIfSettled, 500)
        }
    }

    const sizeStorage = {
        getItem: (_: string) => {
            return apicize.editorPanels
        },
        setItem: (_: string, value: string) => {
            if (apicize.editorPanels != value) {
                lastResize = Date.now()
                saveIfSettled()
            }
        }
    }

    const GroupPanel = observer(() => {
        return <>
            <Stack direction='row' className='editor-panel-header'>
                <EditorTitle icon={<SvgIcon color='folder'><FolderIcon /></SvgIcon>} name={group.name.length ?? 0 > 0 ? `${group.name} - ${usePanel}` : '(Unnamed)'}>
                    <Box display='inline-flex' paddingLeft='1em' visibility={isRunning ? "visible" : "hidden"} width='2em'><PlayArrowIcon color="success" /></Box>
                </EditorTitle>
                <RunToolbar requestEntry={group} />
            </Stack>
            <Box className='editor-panel'>
                <Stack direction='row' className='editor-content' flexGrow={1}>
                    <ToggleButtonGroup
                        className='button-column'
                        orientation='vertical'
                        exclusive
                        onChange={handlePanelChanged}
                        value={usePanel}
                        sx={{ marginRight: '12px', zIndex: 100 }}
                        aria-label="text alignment">
                        <ToggleButton value="Info" title="Show Group Info" aria-label='show info' size='small'><DisplaySettingsIcon /></ToggleButton>
                        <ToggleButton value="Parameters" title="Show Group Parameters" aria-label='show test' size='small'><AltRouteIcon /></ToggleButton>
                        {
                            hasWarnings
                                ? <ToggleButton hidden={true} value="Warnings" title="Request Warnings" aria-label='show warnings'><WarningAmberIcon sx={{ color: '#FFFF00' }} /></ToggleButton>
                                : null
                        }
                    </ToggleButtonGroup>
                    <Box className='panels' flexGrow={1}>
                        <Box>
                            {usePanel === 'Info' ? <RequestGroupInfoEditor group={group} />
                                : usePanel === 'Parameters' ? <RequestParametersEditor requestOrGroup={group} parameters={activeSelection.parameters} />
                                    // : usePanel === 'Warnings' ? <RequestWarningsEditor requestOrGroupId={groupId} />
                                    : null}
                        </Box>
                    </Box>
                </Stack>
            </Box>
        </>
    })

    const GroupEditorLayout = observer((props: { sx?: SxProps, lastExecuted: number }) => {
        return execution && execution.hasResults
            ? <Box sx={props.sx}>
                <PanelGroup autoSaveId="apicize-request" direction="horizontal" className='editor split' storage={sizeStorage}>
                    <Panel id='request-editor' order={0} defaultSize={50} minSize={20} className='split-left'>
                        <GroupPanel />
                    </Panel>
                    <PanelResizeHandle className={'resize-handle'} hitAreaMargins={{ coarse: 30, fine: 10 }} />
                    {
                        <Panel id='results-viewer' order={1} defaultSize={50} minSize={20} >
                            <Box position='relative' display='flex' flexGrow={1}>
                                <Box top={0}
                                    left={0}
                                    width='calc(100% - 1em)'
                                    height='100%'
                                    position='absolute'
                                    display={isRunning ? 'block' : 'none'}
                                    className="MuiBackdrop-root MuiModal-backdrop"
                                    sx={{ zIndex: 99999, opacity: 0.5, transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms", backgroundColor: "#000000" }} />
                                <Box position='relative' display='flex' flexGrow={1} flexDirection='column' className='split-right'>
                                    <RunResultsToolbar className='editor-panel-header' lastExecuted={execution.lastExecuted} />
                                    <ResultsViewer className='results-panel' lastExecuted={execution.lastExecuted} />
                                </Box>
                            </Box>
                        </Panel>
                    }
                </PanelGroup>
            </Box>
            : <Box className='editor group' sx={props.sx}>
                <GroupPanel />
            </Box>
    })

    return <GroupEditorLayout sx={props.sx} lastExecuted={execution.lastExecuted} />

})