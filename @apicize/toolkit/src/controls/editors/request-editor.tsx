import * as React from 'react'
import { ToggleButtonGroup, ToggleButton, Box, Stack, SxProps, Typography, Grid2 } from '@mui/material'
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings'
import FolderIcon from '@mui/icons-material/Folder';
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import AltRouteIcon from '@mui/icons-material/AltRoute'
import { RequestInfoEditor } from './request/request-info-editor'
import { RequestHeadersEditor } from './request/request-headers-editor'
import SendIcon from '@mui/icons-material/Send';
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
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from '../../models/workbook/editable-workbook-request';
import { RunToolbar } from '../run-toolbar';
import { useWorkspace } from '../../contexts/workspace.context';
import { RequestWarningsEditor } from './request/request-warnings.editor';
import { RunResultsToolbar } from '../run-results-toolbar';

export const RequestEditor = observer((props: {
    sx?: SxProps
}) => {
    const [panel, setPanel] = React.useState<string>('Info')

    const workspace = useWorkspace()
    workspace.nextHelpTopic = 'requests/headers'

    if (!workspace.active) {
        return null
    }

    const request = (workspace.active.entityType === EditableEntityType.Request && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequest
        : null

    const group = (workspace.active.entityType === EditableEntityType.Group && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequestGroup
        : null

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    if (!(request || group)) {
        return null
    }

    const execution = workspace.getExecution(workspace.active.id)
    const isExecuted = execution.runs.length > 0

    let usePanel = (
        (group && panel !== 'Info' && panel !== 'Parameters')
    )
        ? 'Info' : panel


    let hasWarnings =
        (request?.warnings?.size ?? 0) > 0 || (group?.warnings?.size ?? 0) > 0

    if (usePanel === 'Warnings') {
        // If user cleared warnings, switch to Parameters
        if ((request?.warnings?.size ?? 0) === 0 && panel === 'Warnings') {
            usePanel = 'Parameters'
        }
    }

    return (
        <Box className={isExecuted ? 'editor-panel with-executions' : 'editor-panel'} flexGrow={1}>
            {
                group ?
                    <Stack direction='row' alignItems='center'>
                        <EditorTitle icon={<FolderIcon />} name={group.name.length ?? 0 > 0 ? `${group.name} - ${panel}` : '(Unnamed)'} />
                        <RunToolbar sx={{ marginLeft: '3em' }} />
                    </Stack>
                    : request
                        ? <Stack direction='row' alignItems='center'>
                            <EditorTitle icon={<SendIcon />} name={(request.name.length > 0) ? `${request.name} - ${panel}` : `(Unnamed) - ${panel}`} />
                            <RunToolbar sx={{ marginLeft: '3em' }} />
                        </Stack>
                        : null
            }

            {
                group
                    ? <Stack direction='row'>
                        <ToggleButtonGroup
                            className='button-column'
                            orientation='vertical'
                            exclusive
                            onChange={handlePanelChanged}
                            value={usePanel}
                            sx={{ marginRight: '24px', zIndex: 100 }}
                            aria-label="text alignment">
                            <ToggleButton value="Info" title="Show Group Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                            <ToggleButton value="Parameters" title="Show Group Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
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
                                        : null}
                            </Box>
                        </Box>
                    </Stack>
                    : request
                        ? <Stack flexGrow={1} direction='row'>
                            <ToggleButtonGroup
                                className='button-column'
                                orientation='vertical'
                                exclusive
                                onChange={handlePanelChanged}
                                value={usePanel}
                                sx={{ marginRight: '24px', zIndex: 100 }}
                                aria-label="text alignment">
                                <ToggleButton value="Info" title="Show Request Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                                <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string'><ViewListIcon /></ToggleButton>
                                <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers'><ViewListOutlinedIcon /></ToggleButton>
                                <ToggleButton value="Body" title="Show Request Body" aria-label='show body'><ArticleOutlinedIcon /></ToggleButton>
                                <ToggleButton value="Test" title="Show Request Test" aria-label='show test'><ScienceIcon /></ToggleButton>
                                <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
                                {
                                    hasWarnings
                                        ? <ToggleButton hidden={true} value="Warnings" title="Request Warnings" aria-label='show warnings'><WarningAmberIcon sx={{ color: '#FFFF00' }} /></ToggleButton>
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
                        : null
            }
            {
                isExecuted ? <RunResultsToolbar /> : null
            }
            {
                isExecuted ? <ResultsViewer /> : null
            }
            
        </Box>
    )
})
