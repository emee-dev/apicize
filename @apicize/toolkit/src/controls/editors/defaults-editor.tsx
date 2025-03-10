import { Stack, FormControl, InputLabel, MenuItem, Select, SxProps, Box, SvgIcon, IconButton, ToggleButtonGroup, ToggleButton, Grid2, TextField, Button } from '@mui/material'
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../contexts/workspace.context';
import { EntitySelection } from '../../models/workspace/entity-selection';
import CloseIcon from '@mui/icons-material/Close';
import { EditorTitle } from '../editor-title';
import DefaultsIcon from '../../icons/defaults-icon';
import AltRouteIcon from '@mui/icons-material/AltRoute'
import DatasetIcon from '@mui/icons-material/Dataset';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';
import { ExternalDataSourceType } from '@apicize/lib-typescript';

export const DefaultsEditor = observer((props: {
    sx: SxProps
}) => {
    const workspace = useWorkspace()
    const defaults = workspace.defaults
    const [panel, setPanel] = useState<string>('Parameters')

    workspace.nextHelpTopic = 'workspace/defaults'

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) setPanel(newValue)
    }

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const lists = workspace.getDefaultParameterLists()

    const ParameterEditor = <Stack spacing={3}>
        <FormControl>
            <InputLabel id='scenario-label-id'>Scenarios</InputLabel>
            <Select
                labelId='scenario-label'
                aria-labelledby='scenario-label-id'
                id='cred-scenario'
                label='Scenario'
                value={defaults.selectedScenario.id}
                onChange={(e) => workspace.setDefaultScenarioId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.scenarios)}
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
                onChange={(e) => workspace.setDefaultAuthorizationId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.authorizations)}
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
                onChange={(e) => workspace.setDefaultCertificateId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.certificates)}
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
                onChange={(e) => workspace.setDefaultProxyId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.proxies)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='data-label-id'>Seed Data</InputLabel>
            <Select
                labelId='data-label'
                aria-labelledby='data-label-id'
                id='cred-data'
                label='Seed Data'
                value={defaults.selectedData.id}
                onChange={(e) => workspace.setDefaultDataId(e.target.value)}
                fullWidth
                size='small'
            >
                {itemsFromSelections(lists.data)}
            </Select>
        </FormControl>
    </Stack>

    const DataEditor = <Stack spacing={3}>
        {
            workspace.defaults.data.values.map(data => (
                <Grid2 container rowSpacing={2} spacing={1} size={12} columns={12}>
                    <Grid2 size={4}>
                        <TextField
                            id={`${data.id}-name`}
                            label='Variable Name'
                            aria-label='variable-name'
                            size="small"
                            value={data.name}
                            error={data.nameInvalid}
                            helperText={data.nameInvalid ? 'Variable name is required' : ''}
                            onChange={(e) => data.updateName(e.target.value)}
                            fullWidth
                        />
                    </Grid2>
                    <Grid2 size={3}>
                        <FormControl fullWidth>
                            <InputLabel id={`${data.id}-type-lbl`}>Type</InputLabel>
                            <Select
                                id={`${data.id}-type`}
                                labelId={`${data.id}-type-lbl`}
                                label='Type'
                                arial-label='variable-type'
                                size='small'
                                value={data.type}
                                sx={{ minWidth: '8rem' }}
                                onChange={e => data.updateSourceType(e.target.value as ExternalDataSourceType)}
                            >
                                <MenuItem key={`${data.id}-type-file-json`} value={ExternalDataSourceType.FileJSON}>JSON File</MenuItem>
                                <MenuItem key={`${data.id}-type-file-csv`} value={ExternalDataSourceType.FileCSV}>CSV File</MenuItem>
                                <MenuItem key={`${data.id}-type-json`} value={ExternalDataSourceType.JSON}>JSON Value</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid2>
                    <Grid2 size={4}>
                        <TextField
                            id={`${data.id}-value`}
                            label='Value'
                            className='code'
                            aria-label='variable-value'
                            rows={10}
                            multiline={data.type == ExternalDataSourceType.JSON}
                            size="small"
                            value={data.source}
                            error={data.sourceError !== null}
                            helperText={data.sourceError ?? ''}
                            onChange={(e) => data.updateSource(e.target.value)}
                            fullWidth
                        />
                    </Grid2>
                    <Grid2 className='namevalue-col-btn' size={1}>
                        <IconButton aria-label="delete" onClick={() => workspace.deleteData(data.id)}>
                            <DeleteIcon color='primary' />
                        </IconButton>
                    </Grid2>
                </Grid2>
            ))
        }
        <Box>
            <Button variant="outlined" aria-label="add" startIcon={<AddIcon />} size='small' onClick={() => workspace.addData()}>Add External Data Source</Button>
        </Box>
    </Stack>

    return <Box marginBottom='1.5em' sx={props.sx} className='editor'>
        <Stack direction='row' className='editor-panel-header'>
            <EditorTitle icon={<SvgIcon color='defaults'><DefaultsIcon /></SvgIcon>} name={`Workbook Defaults - ${panel}`}>
                <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => workspace.returnToNormal()}><CloseIcon fontSize='inherit' /></IconButton>
            </EditorTitle>
        </Stack>

        <Box className='editor'>
            <Stack className='editor-content' direction='row' flexGrow={1}>
                <ToggleButtonGroup
                    orientation='vertical'
                    exclusive
                    onChange={handlePanelChanged}
                    value={panel}
                    sx={{ marginRight: '24px' }}
                    aria-label="text alignment">
                    <ToggleButton value="Parameters" title="Show Default Parameters" aria-label='show test' size='small'><AltRouteIcon /></ToggleButton>
                    <ToggleButton value="ExternalData" title="Show External Data" aria-label='show test' size='small'><DatasetIcon /></ToggleButton>
                </ToggleButtonGroup>
                <Box flexGrow={1} flexDirection='row' className='panels'>
                    {
                        panel == 'Parameters'
                            ? ParameterEditor
                            : panel == 'ExternalData'
                                ? DataEditor
                                : <></>
                    }
                </Box>
            </Stack>
        </Box>
    </Box>
})
