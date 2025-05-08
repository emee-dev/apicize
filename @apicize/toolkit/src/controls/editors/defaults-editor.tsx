import { Stack, FormControl, InputLabel, MenuItem, Select, SxProps, Box, SvgIcon, IconButton, ToggleButtonGroup, ToggleButton, Grid2, TextField, Button } from '@mui/material'
import { observer } from 'mobx-react-lite';
import { useWorkspace, WorkspaceMode } from '../../contexts/workspace.context';
import { Selection } from '@apicize/lib-typescript';
import CloseIcon from '@mui/icons-material/Close';
import { EditorTitle } from '../editor-title';
import DefaultsIcon from '../../icons/defaults-icon';
import AltRouteIcon from '@mui/icons-material/AltRoute'
import DatasetIcon from '@mui/icons-material/Dataset';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { ExternalDataSourceType } from '@apicize/lib-typescript';
import { useFeedback } from '../../contexts/feedback.context';

type DefaulltsPanels = 'Parameters' | 'External Data'

export const DefaultsEditor = observer((props: { sx: SxProps }) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    workspace.nextHelpTopic = 'workspace/defaults'

    const defaults = workspace.defaults
    const parameters = workspace.activeParameters
    const data = workspace.data

    let focusSeed: boolean
    let defaultPanel: DefaulltsPanels
    if (workspace.mode === WorkspaceMode.Seed) {
        if ((data?.length ?? 0) > 0) {
            focusSeed = true
            defaultPanel = 'Parameters'
        } else {
            focusSeed = false
            defaultPanel = 'External Data'
        }
    } else {
        defaultPanel = 'Parameters'
        focusSeed = false
    }

    const [panel, setPanel] = useState<DefaulltsPanels>(defaultPanel)

    if (!parameters) {
        workspace.initializeParameterList()
        return null
    }

    if (!data) {
        workspace.initializeDataList()
        return null
    }


    const handlePanelChanged = (_: React.SyntheticEvent, newValue: DefaulltsPanels) => {
        if (newValue) setPanel(newValue)
    }

    let credIndex = 0
    const itemsFromSelections = (selections: Selection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const ParameterEditor = <Stack spacing={3}>
        <FormControl>
            <InputLabel id='scenario-label-id'>Scenarios</InputLabel>
            <Select
                labelId='scenario-label'
                aria-labelledby='scenario-label-id'
                id='cred-scenario'
                label='Scenario'
                value={defaults.selectedScenario.id}
                onChange={(e) => defaults.setScenarioId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(parameters.scenarios)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='auth-label-id'>Authorization</InputLabel>
            <Select
                labelId='auth-label'
                aria-labelledby='auth-label-id'
                id='cred-auth'
                label='Authorization'
                value={defaults.selectedAuthorization.id}
                onChange={(e) => defaults.setAuthorizationId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(parameters.authorizations)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='cert-label-id'>Certificate</InputLabel>
            <Select
                labelId='cert-label'
                aria-labelledby='cert-label-id'
                id='cred-cert'
                label='Certificate'
                value={defaults.selectedCertificate.id}
                onChange={(e) => defaults.setCertificateId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(parameters.certificates)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='proxy-label-id'>Proxy</InputLabel>
            <Select
                labelId='proxy-label'
                aria-labelledby='proxy-label-id'
                id='cred-proxy'
                label='Proxy'
                value={defaults.selectedProxy.id}
                onChange={(e) => defaults.setProxyId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(parameters.proxies)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='data-label-id'>Seed Data</InputLabel>
            <Select
                autoFocus={focusSeed}
                labelId='data-label'
                aria-labelledby='data-label-id'
                id='cred-data'
                label='Seed Data'
                value={defaults.selectedData.id}
                onChange={(e) => defaults.setDataId(e.target.value)}
                fullWidth
                size='small'
            >
                {itemsFromSelections(parameters.data)}
            </Select>
        </FormControl>
    </Stack>

    const DataEditor = <Stack spacing={3}>
        {
            data.map((d, idx) => (
                <Grid2 key={`def-data-${idx}`} container rowSpacing={2} spacing={1} size={12} columns={12}>
                    <Grid2 size={4}>
                        <TextField
                            id={`${d.id}-name`}
                            label='Variable Name'
                            aria-label='variable-name'
                            size="small"
                            value={d.name ? d.name : ''}
                            error={d.nameInvalid}
                            autoFocus={(d.name?.length ?? 0) === 0}
                            helperText={d.nameInvalid ? 'Variable name is required' : ''}
                            onChange={(e) => d.setName(e.target.value)}
                            fullWidth
                        />
                    </Grid2>
                    <Grid2 size={3}>
                        <FormControl fullWidth>
                            <InputLabel id={`${d.id}-type-lbl`}>Type</InputLabel>
                            <Select
                                id={`${d.id}-type`}
                                labelId={`${d.id}-type-lbl`}
                                label='Type'
                                arial-label='variable-type'
                                size='small'
                                value={d.type}
                                sx={{ minWidth: '8rem' }}
                                onChange={e => d.setSourceType(e.target.value as ExternalDataSourceType)}
                            >
                                <MenuItem key={`${d.id}-type-file-json`} value={ExternalDataSourceType.FileJSON}>JSON File</MenuItem>
                                <MenuItem key={`${d.id}-type-file-csv`} value={ExternalDataSourceType.FileCSV}>CSV File</MenuItem>
                                <MenuItem key={`${d.id}-type-json`} value={ExternalDataSourceType.JSON}>JSON Value</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid2>
                    <Grid2 size={4}>
                        <TextField
                            id={`${d.id}-value`}
                            label='Value'
                            className='code'
                            aria-label='variable-value'
                            rows={10}
                            multiline={d.type == ExternalDataSourceType.JSON}
                            size="small"
                            value={d.source ? d.source : ''}
                            error={d.sourceError !== null}
                            helperText={d.sourceError ?? ''}
                            onChange={(e) => d.setSource(e.target.value)}
                            fullWidth
                        />
                    </Grid2>
                    <Grid2 className='namevalue-col-btn' size={1}>
                        <IconButton aria-label="delete" onClick={() => workspace.deleteData(d.id)}>
                            <DeleteIcon color='primary' />
                        </IconButton>
                    </Grid2>
                </Grid2>
            ))
        }
        <Box>
            <Button variant="outlined" aria-label="add" startIcon={<AddIcon />} size='small' onClick={() => workspace.addData(null)}>Add External Data Source</Button>
        </Box>
    </Stack>

    return <Box marginBottom='1.5em' sx={props.sx} className='editor'>
        <Stack direction='row' className='editor-panel-header'>
            <EditorTitle icon={<SvgIcon color='defaults'><DefaultsIcon /></SvgIcon>} name={`Workbook Defaults - ${panel}`}>
                <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => workspace.returnToNormal()}><CloseIcon fontSize='inherit' /></IconButton>
            </EditorTitle>
        </Stack>

        <Box className='editor-panel'>
            <Stack className='editor-content' direction='row' flexGrow={1}>
                <ToggleButtonGroup
                    orientation='vertical'
                    exclusive
                    onChange={handlePanelChanged}
                    value={panel}
                    sx={{ marginRight: '24px' }}
                    aria-label="text alignment">
                    <ToggleButton value="Parameters" title="Show Default Parameters" aria-label='show test' size='small'><AltRouteIcon /></ToggleButton>
                    <ToggleButton value="External Data" title="Show External Data" aria-label='show test' size='small'><DatasetIcon /></ToggleButton>
                </ToggleButtonGroup>
                <Box flexGrow={1} flexDirection='row' className='panels'>
                    {
                        panel == 'Parameters'
                            ? ParameterEditor
                            : panel == 'External Data'
                                ? DataEditor
                                : <></>
                    }
                </Box>
            </Stack>
        </Box>
    </Box>
})
