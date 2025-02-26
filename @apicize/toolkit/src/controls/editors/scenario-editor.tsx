import { Stack, TextField, SxProps, Grid2, Box, SvgIcon, IconButton, Button, FormControl, MenuItem, Select, InputLabel } from '@mui/material'
import { EditorTitle } from '../editor-title';
import { observer } from 'mobx-react-lite';
import { EditableScenario, EditableVariable } from '../../models/workspace/editable-scenario';
import { useWorkspace } from '../../contexts/workspace.context';
import ScenarioIcon from '../../icons/scenario-icon';
import { GenerateIdentifier } from '../../services/random-identifier-generator';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { VariableSourceType } from '@apicize/lib-typescript';

export const ScenarioEditor = observer((props: { sx: SxProps }) => {
    const workspace = useWorkspace()
    const scenario = workspace.active as EditableScenario
    workspace.nextHelpTopic = 'workspace/scenarios'

    const onAddVariable = () => {
        scenario.variables.push(new EditableVariable(
            GenerateIdentifier(),
            '',
            VariableSourceType.Text,
            ''
        ))
    }

    const onDeleteVariable = (id: string) => {
        scenario.variables = scenario.variables.filter(v => v.id !== id)
    }

    return (
        <Stack direction={'column'} className='editor' sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<SvgIcon color='scenario'><ScenarioIcon /></SvgIcon>} name={scenario.name.length > 0 ? scenario.name : '(Unnamed)'} />
            </Box>
            <Grid2 container direction={'column'} spacing={3} className='editor-single-panel'>
                <Grid2 marginBottom='1em'>
                    <TextField
                        id='scenario-name'
                        label='Name'
                        aria-label='scenario name'
                        size='small'
                        value={scenario.name}
                        onChange={e => workspace.setName(e.target.value)}
                        error={scenario.nameInvalid}
                        helperText={scenario.nameInvalid ? 'Scenario name is required' : ''}
                        fullWidth
                    />
                </Grid2>
                <Grid2>
                    <Stack direction='column' position='relative' width='100%'>
                        <Grid2 container spacing={4}>
                            {
                                (scenario.variables ?? []).map(variable => [
                                    <Grid2 container rowSpacing={2} spacing={1} size={12} columns={13}>
                                        <Grid2 size={{ md: 5, lg: 3 }}>
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
                                        <Grid2 size={{ md: 2, lg: 2 }}>
                                            <FormControl>
                                                <InputLabel id={`${variable.id}-type-lbl`}>Type</InputLabel>
                                                <Select
                                                    id={`${variable.id}-type`}
                                                    labelId={`${variable.id}-type-lbl`}
                                                    label='Type'
                                                    arial-label='variable-type'
                                                    size='small'
                                                    value={variable.type}
                                                    sx={{ minWidth: '8rem' }}
                                                    onChange={e => variable.updateSourceType(e.target.value as VariableSourceType)}
                                                >
                                                    <MenuItem key={`${variable.id}-type-text`} value={VariableSourceType.Text}>Text Value</MenuItem>
                                                    <MenuItem key={`${variable.id}-type-json`} value={VariableSourceType.JSON}>JSON Value</MenuItem>
                                                    <MenuItem key={`${variable.id}-type-file-json`} value={VariableSourceType.FileJSON}>JSON File</MenuItem>
                                                    <MenuItem key={`${variable.id}-type-file-csv`} value={VariableSourceType.FileCSV}>CSV File</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid2>
                                        <Grid2 size={{ md: 5, lg: 7 }}>
                                            <TextField
                                                id={`${variable.id}-value`}
                                                label='Value'
                                                className='code'
                                                aria-label='variable-value'
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
                                        <Grid2 className='namevalue-col-btn' size={{ md: 1, lg: 1 }}>
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

                </Grid2>
            </Grid2>
        </Stack >
    )
})
