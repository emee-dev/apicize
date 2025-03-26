import { Stack, TextField, SxProps, Grid2, Box, SvgIcon, IconButton, Button, FormControl, MenuItem, Select, InputLabel } from '@mui/material'
import { EditorTitle } from '../editor-title';
import { observer } from 'mobx-react-lite';
import { EditableScenario, EditableVariable } from '../../models/workspace/editable-scenario';
import ScenarioIcon from '../../icons/scenario-icon';
import { GenerateIdentifier } from '../../services/random-identifier-generator';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { VariableSourceType } from '@apicize/lib-typescript';
import { useWorkspaceSession } from '../../contexts/workspace-session.context';

export const ScenarioEditor = observer((props: { sx: SxProps, scenario: EditableScenario }) => {
    const session = useWorkspaceSession()
    session.nextHelpTopic = 'workspace/scenarios'

    const onAddVariable = () => {
        props.scenario.variables.push(new EditableVariable(
            GenerateIdentifier(),
            '',
            VariableSourceType.Text,
            ''
        ))
    }

    const onDeleteVariable = (id: string) => {
        props.scenario.variables = props.scenario.variables.filter(v => v.id !== id)
    }

    return (
        <Stack direction='column' className='editor scenario' sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<SvgIcon color='scenario'><ScenarioIcon /></SvgIcon>} name={props.scenario.name.length > 0 ? props.scenario.name : '(Unnamed)'} />
            </Box>
            <Box className='editor-panel'>
                <Stack className='editor-content' direction='column' spacing={3}>
                    <TextField
                        id='scenario-name'
                        label='Name'
                        aria-label='scenario name'
                        size='small'
                        value={props.scenario.name}
                        onChange={e => props.scenario.setName(e.target.value)}
                        error={props.scenario.nameInvalid}
                        helperText={props.scenario.nameInvalid ? 'Scenario name is required' : ''}
                        fullWidth
                    />
                    <Stack direction='column' paddingTop='2em'>
                        <Grid2 container spacing={3}>
                            {
                                (props.scenario.variables ?? []).map(variable => [
                                    <Grid2 container rowSpacing={2} spacing={1} size={12} columns={12}>
                                        <Grid2 size={{ md: 3 }}>
                                            <TextField
                                                id={`${variable.id}-name`}
                                                label='Variable Name'
                                                aria-label='variable-name'
                                                size="small"
                                                value={variable.name}
                                                error={variable.nameInvalid}
                                                helperText={variable.nameInvalid ? 'Variable name is required' : ''}
                                                onChange={(e) => variable.updateName(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid2>
                                        <Grid2 size={{ md: 2 }}>
                                            <FormControl sx={{ width: '100%' }}>
                                                <InputLabel id={`${variable.id}-type-lbl`}>Type</InputLabel>
                                                <Select
                                                    id={`${variable.id}-type`}
                                                    labelId={`${variable.id}-type-lbl`}
                                                    label='Type'
                                                    arial-label='variable-type'
                                                    size='small'
                                                    value={variable.type}
                                                    onChange={e => variable.updateSourceType(e.target.value as VariableSourceType)}
                                                >
                                                    <MenuItem key={`${variable.id}-type-text`} value={VariableSourceType.Text}>Text Value</MenuItem>
                                                    <MenuItem key={`${variable.id}-type-json`} value={VariableSourceType.JSON}>JSON Value</MenuItem>
                                                    <MenuItem key={`${variable.id}-type-file-json`} value={VariableSourceType.FileJSON}>JSON File</MenuItem>
                                                    <MenuItem key={`${variable.id}-type-file-csv`} value={VariableSourceType.FileCSV}>CSV File</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid2>
                                        <Grid2 size={{ md: 6 }}>
                                            <TextField
                                                id={`${variable.id}-value`}
                                                label='Value'
                                                className='code'
                                                aria-label='variable-value'
                                                sx={{ width: '100%' }}
                                                rows={10}
                                                multiline={variable.type == VariableSourceType.JSON}
                                                size="small"
                                                value={variable.value}
                                                error={variable.valueError !== null}
                                                helperText={variable.valueError ?? ''}
                                                onChange={(e) => variable.updateValue(e.target.value)}
                                                fullWidth
                                            />
                                        </Grid2>
                                        <Grid2 className='namevalue-col-btn' size={{ md: 1 }}>
                                            <IconButton aria-label="delete" onClick={() => onDeleteVariable(variable.id)}>
                                                <DeleteIcon color='primary' />
                                            </IconButton>
                                        </Grid2>
                                    </Grid2>
                                ])
                            }
                            <Box>
                                <Button variant="outlined" aria-label="add" startIcon={<AddIcon />} size='small' onClick={() => onAddVariable()}>Add Scenario Variable</Button>
                            </Box>
                        </Grid2>
                    </Stack>
                </Stack>
            </Box>
        </Stack >
    )
})
