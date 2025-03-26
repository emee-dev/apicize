import { TextField, SxProps, Grid, FormControl, InputLabel, MenuItem, Select, Grid2, ToggleButton, Stack } from '@mui/material'
import { GroupExecution } from '@apicize/lib-typescript';
import { EditableRequestGroup } from '../../../models/workspace/editable-request-group';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../../contexts/workspace.context';
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { NO_SELECTION_ID } from '../../../models/store';
import { useWorkspaceSession } from '../../../contexts/workspace-session.context';

export const RequestGroupEditor = observer((props: {
    sx?: SxProps,
    group: EditableRequestGroup
}) => {
    const workspace = useWorkspace()
    const session = useWorkspaceSession()
    const feedback = useFeedback()

    const execution = workspace.executions.get(props.group.id)
    const running = execution?.running ?? false
    session.nextHelpTopic = 'workspace/groups'

    const isUsingSeedData = workspace.defaults.selectedData.id !== NO_SELECTION_ID

    const handleRunClick = () => async () => {
        try {
            await workspace.executeRequest(props.group.id)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    return (
        <Grid2 container direction='column' spacing={3} sx={props.sx}>
            <Grid2>
                <TextField
                    id='group-name'
                    label='Name'
                    aria-label='group name'
                    sx={{ flexGrow: 1 }}
                    size='small'
                    fullWidth
                    // size='small'
                    value={props.group.name}
                    onChange={e => props.group.setName(e.target.value)}
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
                        value={props.group.runs}
                        onChange={e => props.group.setRuns(parseInt(e.target.value))}
                    />
                    <ToggleButton value='Run' title={`Run selected group ${props.group.runs} times`} disabled={running} onClick={handleRunClick()} size='small'>
                        <PlayCircleFilledIcon color={running ? 'disabled' : 'success'} />
                    </ToggleButton>
                </Grid2>
                <Grid2>
                    <FormControl>
                        <InputLabel id='multirun-execution-label-id'>Group Execution</InputLabel>
                        <Select
                            labelId='execution-label-id'
                            id='group-run-execution'
                            aria-labelledby='multirun-execution-label-id'
                            value={props.group.multiRunExecution}
                            disabled={props.group.runs < 2}
                            sx={{ minWidth: '10em' }}
                            label='Group Execution'
                            size='small'
                            onChange={e => props.group.setMultiRunExecution(e.target.value as GroupExecution)}
                        >
                            <MenuItem value={GroupExecution.Sequential}>Sequential</MenuItem>
                            <MenuItem value={GroupExecution.Concurrent}>Concurrent</MenuItem>
                        </Select>
                    </FormControl>
                </Grid2>
                <Grid2>
                    <FormControl>
                        <InputLabel id='execution-label-id'>Group Item Execution</InputLabel>
                        <Select
                            labelId='execution-label-id'
                            id='execution'
                            aria-labelledby='execution-label-id'
                            value={props.group.execution}
                            disabled={isUsingSeedData}
                            sx={{ minWidth: '10em' }}
                            size='small'
                            label='Group Item Execution'
                            onChange={e => props.group.setGroupExecution(e.target.value as GroupExecution)}
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