import * as React from 'react'
import { ToggleButtonGroup, ToggleButton, Box, Stack, SxProps, Typography } from '@mui/material'
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
import { RunInformation } from '../../models/workbook/run-information';
import { RunToolbar } from '../run-toolbar';
import { useWorkspace } from '../../contexts/workspace.context';

export const RequestEditor = observer((props: {
    sx: SxProps
}) => {
    const [panel, setPanel] = React.useState<string>('Info')

    const workspace = useWorkspace()

    const request = (workspace.active?.entityType === EditableEntityType.Request && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequest
        : null

    const group = (workspace.active?.entityType === EditableEntityType.Group && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequestGroup
        : null

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    if (! (request || group)) {
        return null
    }

    const usePanel = (group && panel !== 'Info' && panel !== 'Parameters')
        ? 'Info' : panel

    return  (
        <Stack direction='column' className='editor-panel' sx={{ ...props.sx, display: 'flex' }}>
            <Stack sx={{ height: '50vh', paddingBottom: '48px', flexBasis: 2 }}>
                {
                    group
                        ? (
                            <Box sx={{ display: "flex", bottom: 0 }}>
                                <ToggleButtonGroup
                                    className='button-column'
                                    orientation='vertical'
                                    exclusive
                                    onChange={handlePanelChanged}
                                    value={usePanel}
                                    sx={{ marginRight: '24px' }}
                                    aria-label="text alignment">
                                    <ToggleButton value="Info" title="Show Group Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                                    <ToggleButton value="Parameters" title="Show Group Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
                                </ToggleButtonGroup>
                                <Box className='panels' sx={{ flexGrow: 1 }}>
                                    <EditorTitle icon={<FolderIcon />} name={group.name.length ?? 0 > 0 ? `${group.name} - ${panel}` : '(Unnamed)'} />
                                    {usePanel === 'Info' ? <RequestGroupEditor />
                                        : usePanel === 'Parameters' ? <RequestParametersEditor />
                                            : null}
                                </Box>
                            </Box>
                        )
                        : request ?
                            (
                                <Box sx={{ display: "flex", bottom: 0 }}>
                                    <ToggleButtonGroup
                                        className='button-column'
                                        orientation='vertical'
                                        exclusive
                                        onChange={handlePanelChanged}
                                        value={usePanel}
                                        sx={{ marginRight: '24px' }}
                                        aria-label="text alignment">
                                        <ToggleButton value="Info" title="Show Request Info" aria-label='show info'><DisplaySettingsIcon /></ToggleButton>
                                        <ToggleButton value="Query String" title="Show Request Query String" aria-label='show query string'><ViewListIcon /></ToggleButton>
                                        <ToggleButton value="Headers" title="Show Request Headers" aria-label='show headers'><ViewListOutlinedIcon /></ToggleButton>
                                        <ToggleButton value="Body" title="Show Request Body" aria-label='show body'><ArticleOutlinedIcon /></ToggleButton>
                                        <ToggleButton value="Test" title="Show Request Test" aria-label='show test'><ScienceIcon /></ToggleButton>
                                        <ToggleButton value="Parameters" title="Show Request Parameters" aria-label='show test'><AltRouteIcon /></ToggleButton>
                                    </ToggleButtonGroup>
                                    <Box className='panels' sx={{ flexGrow: 1 }}>
                                        <EditorTitle icon={<SendIcon />} name={(request.name.length > 0) ? `${request.name} - ${panel}` : `(Unnamed) - ${panel}`} />
                                        {usePanel === 'Info' ? <RequestInfoEditor />
                                            : usePanel === 'Headers' ? <RequestHeadersEditor />
                                                : usePanel === 'Query String' ? <RequestQueryStringEditor />
                                                    : usePanel === 'Body' ? <RequestBodyEditor />
                                                        : usePanel === 'Test' ? <RequestTestEditor />
                                                            : usePanel === 'Parameters' ? <RequestParametersEditor />
                                                                : null}
                                    </Box>
                                </Box>
                            ) :
                            null
                }
            </Stack>
            <RunToolbar />
            <ResultsViewer
                sx={{ paddingTop: '48px', flexGrow: 1 }}
            />
        </Stack>
    )
})
