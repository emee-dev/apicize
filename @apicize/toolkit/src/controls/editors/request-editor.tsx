import * as React from 'react'
import { ToggleButtonGroup, ToggleButton, Box, Stack, SxProps, Typography, Grid2, useColorScheme, SvgIcon } from '@mui/material'
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import FolderIcon from '../../icons/folder-icon'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import { RequestInfoEditor } from './request/request-info-editor'
import { RequestHeadersEditor } from './request/request-headers-editor'
import ScienceIcon from '@mui/icons-material/Science';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { RequestQueryStringEditor } from './request/request-query-string-editor'
import { RequestBodyEditor } from './request/request-body-editor'
import { RequestTestEditor } from './request/request-test-editor'
import { ResultsViewer } from '../viewers/results-viewer'
import { RequestGroupEditor } from './request/request-group-editor';
import { EditorTitle } from '../editor-title';
import { RequestParametersEditor } from './request/request-parameters-editor';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workspace/editable-entity-type';
import { EditableRequest, EditableRequestGroup } from '../../models/workspace/editable-request';
import { RunToolbar } from '../run-toolbar';
import { useWorkspace } from '../../contexts/workspace.context';
import { RequestWarningsEditor } from './request/request-warnings.editor';
import { RunResultsToolbar } from '../run-results-toolbar';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useApicizeSettings } from '../../contexts/apicize-settings.context';
import { useFileOperations } from '../../contexts/file-operations.context';
import RequestIcon from '../../icons/request-icon';

type RequestPanel = 'Info' | 'Headers' | 'Query String' | 'Body' | 'Test' | 'Parameters' | 'Warnings'

export const RequestEditor = observer((props: {
    sx?: SxProps
}) => {
    const [panel, setPanel] = React.useState<RequestPanel>('Info')

    const workspace = useWorkspace()
    const settings = useApicizeSettings()
    const fileOps = useFileOperations()

    if (!workspace.active) {
        return null
    }

    const request = (workspace.active.entityType === EditableEntityType.Request)
        ? workspace.active as EditableRequest
        : null

    const group = (workspace.active.entityType === EditableEntityType.Group)
        ? workspace.active as EditableRequestGroup
        : null

    if (!(request || group)) {
        return null
    }

    workspace.nextHelpTopic = request ? 'workspace/groups' : 'workspace/requests'

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: RequestPanel) => {
        if (newValue) setPanel(newValue)
    }

    const requestExecution = workspace.executions.get(workspace.active.id)
    const isExecuted = (requestExecution?.results?.length ?? 0) > 0
    const isRunning = requestExecution?.running

    let usePanel = (
        (group && panel !== 'Info' && panel !== 'Parameters' && panel !== 'Warnings')
    )
        ? 'Info' : panel


    let hasWarnings =
        (request?.warnings?.size ?? 0) > 0 || (group?.warnings?.size ?? 0) > 0

    if (usePanel === 'Warnings') {
        const warnings = request ? request.warnings : group?.warnings
        // If user cleared warnings, switch to Parameters
        if ((warnings?.size ?? 0) === 0 && panel === 'Warnings') {
            usePanel = 'Parameters'
        }
    }

    let lastResize = 0
    const saveIfSettled = () => {
        if (Date.now() - lastResize > 500) {
            fileOps.saveSettings()
        } else {
            setTimeout(saveIfSettled, 500)
        }
    }
    const sizeStorage = {
        getItem: (_: string) => {
            return settings.editorPanels
        },
        setItem: (_: string, value: string) => {
            lastResize = Date.now()
            settings.editorPanels = value
            saveIfSettled()
        }
    }

    const RequestPanel = () => {
        return group ?
            <>
                <Stack direction='row' className='editor-panel-header'>
                    <EditorTitle icon={<SvgIcon color='folder'><FolderIcon /></SvgIcon>} name={group.name.length ?? 0 > 0 ? `${group.name} - ${panel}` : '(Unnamed)'}>
                        <Box display='inline-flex' paddingLeft='1em' visibility={isRunning ? "visible" : "hidden"} width='2em'><PlayArrowIcon color="success" /></Box>
                    </EditorTitle>
                    <RunToolbar />
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
                                {usePanel === 'Info' ? <RequestGroupEditor />
                                    : usePanel === 'Parameters' ? <RequestParametersEditor />
                                        : usePanel === 'Warnings' ? <RequestWarningsEditor />
                                            : null}
                            </Box>
                        </Box>
                    </Stack>
                </Box>
            </>
            : request
                ? <>
                    <Stack direction='row' className='editor-panel-header'>
                        <EditorTitle icon={<SvgIcon color='request'><RequestIcon /></SvgIcon>} name={(request.name.length > 0) ? `${request.name} - ${panel}` : `(Unnamed) - ${panel}`}>
                            <Box display='inline-flex' paddingLeft='1em' visibility={isRunning ? "visible" : "hidden"} width='2em'><PlayArrowIcon color="success" /></Box>
                        </EditorTitle>
                        <RunToolbar />
                    </Stack>
                    <Box className='editor-panel'>
                        <Stack direction='row' flexGrow={1} className='editor-content'>
                            <ToggleButtonGroup
                                className='button-column'
                                orientation='vertical'
                                exclusive
                                onChange={handlePanelChanged}
                                value={usePanel}
                                sx={{ marginRight: '12px', zIndex: 100 }}
                                aria-label="text alignment">
                                <ToggleButton value="Info" title="Show Request Info" aria-label='show info' size='small'><DisplaySettingsIcon /></ToggleButton>
                                <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string' size='small'><ViewListIcon /></ToggleButton>
                                <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers' size='small'><ViewListOutlinedIcon /></ToggleButton>
                                <ToggleButton value="Body" title="Show Request Body" aria-label='show body' size='small'><ArticleOutlinedIcon /></ToggleButton>
                                <ToggleButton value="Test" title="Show Request Tests" aria-label='show test' size='small'><ScienceIcon /></ToggleButton>
                                <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show parameters' size='small'><AltRouteIcon /></ToggleButton>
                                {
                                    hasWarnings
                                        ? <ToggleButton hidden={true} value="Warnings" title="Request Warnings" aria-label='show warnings' size='small'><WarningAmberIcon sx={{ color: '#FFFF00' }} /></ToggleButton>
                                        : null
                                }
                            </ToggleButtonGroup>

                            <Box flexGrow={1} className='panels'>
                                {usePanel === 'Info' ? <RequestInfoEditor />
                                    : usePanel === 'Headers' ? <RequestHeadersEditor />
                                        : usePanel === 'Query String' ? <RequestQueryStringEditor />
                                            : usePanel === 'Body' ? <RequestBodyEditor />
                                                : usePanel === 'Test' ? <RequestTestEditor />
                                                    : usePanel === 'Parameters' ? <RequestParametersEditor />
                                                        : usePanel === 'Warnings' ? <RequestWarningsEditor />
                                                            : null}
                            </Box>
                        </Stack>
                    </Box>
                </>
                : null
    }

    return isExecuted
        ? <PanelGroup autoSaveId="apicize-request" direction="horizontal" className='editor split' storage={sizeStorage}>
            <Panel id='request-editor' order={0} defaultSize={50} minSize={20} className='split-left'>
                <RequestPanel />
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
                            <RunResultsToolbar className='editor-panel-header' />
                            <ResultsViewer className='results-panel' />
                        </Box>
                    </Box>
                </Panel>
            }
        </PanelGroup>
        : <Box className={`editor ${group ? 'group' : 'request'}`}>
            <RequestPanel />
        </Box>
})
