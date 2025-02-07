import { TextField, SxProps, Grid, FormControl, InputLabel, MenuItem, Select, Grid2, ToggleButton, Stack } from '@mui/material'
import { GroupExecution } from '@apicize/lib-typescript';
import { EditableRequestGroup } from '../../../models/workspace/editable-request';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../../contexts/workspace.context';
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'

export const RequestGroupEditor = observer((props: {
    sx?: SxProps
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()


    const group = workspace.active as EditableRequestGroup
    const execution = workspace.executions.get(group.id)
    const running = execution?.running ?? false
    workspace.nextHelpTopic = 'workspace/groups'


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
                    size='small'
                    fullWidth
                    // size='small'
                    value={group.name}
                    onChange={e => workspace.setName(e.target.value)}
                />
            </Grid2>
            <Grid2 container direction='row' spacing={2}>
                <Grid2 container direction='row' spacing={0}>
                    <TextField
                        aria-label='Nubmer of Run Attempts'
                        placeholder='Attempts'
                        label='# of Runs'
                        disabled={running}
                        sx={{ width: '8em', flexGrow: 0 }}
                        size='small'
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
                    <ToggleButton value='Run' title={`Run selected request ${group.runs} times`} disabled={running} onClick={handleRunClick()} size='small'>
                        <PlayCircleFilledIcon color={running ? 'disabled' : 'success'} />
                    </ToggleButton>
                </Grid2>
                <Grid2>
                    <FormControl>
                        <InputLabel id='multirun-execution-label-id'>Multi-Run Execution</InputLabel>
                        <Select
                            labelId='execution-label-id'
                            id='multi-run-execution'
                            aria-labelledby='multirun-execution-label-id'
                            value={group.multiRunExecution}
                            disabled={group.runs < 2}
                            sx={{ minWidth: '11em' }}
                            label='Multi-Run Execution'
                            size='small'
                            onChange={e => workspace.setMultiRunExecution(e.target.value as GroupExecution)}
                        >
                            <MenuItem value={GroupExecution.Sequential}>Sequential</MenuItem>
                            <MenuItem value={GroupExecution.Concurrent}>Concurrent</MenuItem>
                        </Select>
                    </FormControl>
                </Grid2>
                <Grid2>
                    <FormControl>
                        <InputLabel id='execution-label-id'>Group Execution</InputLabel>
                        <Select
                            labelId='execution-label-id'
                            id='execution'
                            aria-labelledby='execution-label-id'
                            value={group.execution}
                            sx={{ minWidth: '11em' }}
                            size='small'
                            label='Group Execution'
                            onChange={e => workspace.setGroupExecution(e.target.value as GroupExecution)}
                        >
                            <MenuItem value={GroupExecution.Sequential}>Sequential</MenuItem>
                            <MenuItem value={GroupExecution.Concurrent}>Concurrent</MenuItem>
                        </Select>
                    </FormControl>
                </Grid2>
            </Grid2>
        </Grid2>
    )
})