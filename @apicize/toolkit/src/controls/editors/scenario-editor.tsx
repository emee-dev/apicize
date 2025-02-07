import { Stack, TextField, SxProps, Grid2, Box, SvgIcon } from '@mui/material'
import { NameValueEditor } from './name-value-editor';
import { EditorTitle } from '../editor-title';
import { observer } from 'mobx-react-lite';
import { EditableScenario } from '../../models/workspace/editable-scenario';
import { useWorkspace } from '../../contexts/workspace.context';
import ScenarioIcon from '../../icons/scenario-icon';

export const ScenarioEditor = observer((props: { sx: SxProps }) => {
    const workspace = useWorkspace()
    const scenario = workspace.active as EditableScenario
    workspace.nextHelpTopic = 'workspace/scenarios'

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
                    <NameValueEditor title='scenario variables' values={scenario.variables} nameHeader='Variable Name' valueHeader='Value' onUpdate={(e) => workspace.setScenarioVariables(e)} />
                </Grid2>
            </Grid2>
        </Stack >
    )
})
