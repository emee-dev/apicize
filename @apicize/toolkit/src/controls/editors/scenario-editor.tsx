import { Stack, TextField, SxProps, Grid2 } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language';
import { NameValueEditor } from './name-value-editor';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { EditableWorkbookScenario } from '../../models/workbook/editable-workbook-scenario';
import { useWorkspace } from '../../contexts/workspace.context';

export const ScenarioEditor = observer((props: {sx: SxProps}) => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Scenario || workspace.helpVisible) return null
    const scenario = workspace.active as EditableWorkbookScenario
    return (
         <Stack direction={'column'} className='editor-panel-no-toolbar' sx={props.sx}>
            <EditorTitle icon={<LanguageIcon />} name={scenario.name.length > 0 ? scenario.name : '(Unnamed)'} />
            <Grid2 container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid2>
                    <TextField
                        id='scenario-name'
                        label='Name'
                        aria-label='scenario name'
                        // size='small'
                        value={scenario.name}
                        onChange={e => workspace.setName(e.target.value)}
                        error={scenario.nameInvalid}
                        helperText={scenario.nameInvalid ? 'Scenario name is required' : ''}
                        fullWidth
                    />
                </Grid2>
                <Grid2>
                    <PersistenceEditor onUpdatePersistence={(e) => workspace.setScenarioPersistence(e)} persistence={scenario.persistence} />
                </Grid2>
                <Grid2>
                    <NameValueEditor title='scenario variables' values={scenario.variables} nameHeader='Variable Name' valueHeader='Value' onUpdate={(e) => workspace.setScenarioVariables(e)} />
                </Grid2>
            </Grid2>
        </Stack >
    )
})
