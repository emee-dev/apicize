import { TextField, SxProps, Grid, FormControl, InputLabel, MenuItem, Select, Grid2, ToggleButton, Stack } from '@mui/material'
import { WorkbookGroupExecution } from '@apicize/lib-typescript';
import { EditableWorkbookRequestGroup } from '../../../models/workbook/editable-workbook-request';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../../contexts/workspace.context';
import { request } from 'http';
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type';

export const RequestGroupEditor = observer((props: {
    sx?: SxProps
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    if (workspace.active?.entityType !== EditableEntityType.Group) {
        return null
    }

    workspace.nextHelpTopic = 'groups'
    const group = workspace.active as EditableWorkbookRequestGroup
    const execution = workspace.getExecution(group.id)

    const updateRuns = (runs: number) => {
        workspace.setRequestRuns(runs)
    }

    const handleRunClick = () => async () => {
        try {
            await workspace.executeRequest(group.id)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    return (
        <Grid2 container direction='column' spacing={3} maxWidth='60em' sx={props.sx}>
            <Grid2>
                <TextField
                    id='group-name'
                    label='Name'
                    aria-label='group name'
                    sx={{ flexGrow: 1 }}
                    fullWidth
                    // size='small'
                    value={group.name}
                    onChange={e => workspace.setName(e.target.value)}
                />
            </Grid2>
            <Grid2>
                <Stack display='flex' direction='row' justifyItems='center'>
                    <TextField
                        aria-label='Nubmer of Run Attempts'
                        placeholder='Attempts'
                        label='# of Runs'
                        disabled={execution.running}
                        sx={{ width: '8em', flexGrow: 0 }}
                        type='number'
                        slotProps={{
                            htmlInput: {
                                min: 1,
                                max: 1000
                            }
                        }}
                        value={group.runs}
                        onChange={e => updateRuns(parseInt(e.target.value))}
                    />
                    <ToggleButton value='Run' title='Run selected request' disabled={execution.running} onClick={handleRunClick()}>
                        <PlayCircleFilledIcon color={execution.running ? 'disabled' : 'success'} />
                    </ToggleButton>
                    <FormControl sx={{marginLeft: '2em'}}>
                        <InputLabel id='multirun-execution-label-id'>Multiple Run Execution Mode</InputLabel>
                        <Select
                            labelId='execution-label-id'
                            id='multi-run-execution'
                            aria-labelledby='multirun-execution-label-id'
                            value={group.multiRunExecution}
                            sx={{ width: '14em' }}
                            label='Multiple Run Execution Mode'
                            onChange={e => workspace.setMultiRunExecution(e.target.value as WorkbookGroupExecution)}
                        >
                            <MenuItem value={WorkbookGroupExecution.Sequential}>Sequential</MenuItem>
                            <MenuItem value={WorkbookGroupExecution.Concurrent}>Concurrent</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl sx={{marginLeft: '2em'}}>
                        <InputLabel id='execution-label-id'>Request Execution Mode</InputLabel>
                        <Select
                            labelId='execution-label-id'
                            id='execution'
                            aria-labelledby='execution-label-id'
                            value={group.execution}
                            sx={{ width: '14em' }}
                            label='Request Execution Mode'
                            onChange={e => workspace.setGroupExecution(e.target.value as WorkbookGroupExecution)}
                        >
                            <MenuItem value={WorkbookGroupExecution.Sequential}>Sequential</MenuItem>
                            <MenuItem value={WorkbookGroupExecution.Concurrent}>Concurrent</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Grid2>
        </Grid2 >
    )
})