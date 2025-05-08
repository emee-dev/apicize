import { TextField, SxProps, Grid, FormControl, InputLabel, MenuItem, Select, Grid2, ToggleButton, Stack } from '@mui/material'
import { GroupExecution } from '@apicize/lib-typescript';
import { EditableRequestGroup } from '../../../models/workspace/editable-request-group';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../../contexts/workspace.context';
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { NO_SELECTION_ID } from '../../../models/store';
import { EditableDefaults } from '../../../models/workspace/editable-defaults';
import { useState } from 'react';

export const RequestGroupInfoEditor = observer((props: {
    sx?: SxProps,
    group: EditableRequestGroup | null
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    const group = props.group
    if (!group) {
        return null
    }

    const execution = workspace.executions.get(group.id)
    const running = execution?.isRunning ?? false
    workspace.nextHelpTopic = 'workspace/groups'

    const isUsingSeedData = workspace.defaults.selectedData.id !== NO_SELECTION_ID

    const handleRunClick = () => async () => {
        try {
            await workspace.executeRequest(group.id)
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
                    // autoFocus={group.name === ''}
                    size='small'
                    fullWidth
                    // size='small'
                    value={group.name}
                    onChange={e => group.setName(e.target.value)}
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
                        onChange={e => group.setRuns(parseInt(e.target.value))}
                    />
                    <ToggleButton value='Run' title={`Run selected group ${group.runs} times`} disabled={running} onClick={handleRunClick()} size='small'>
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
                            value={group.multiRunExecution}
                            disabled={group.runs < 2}
                            sx={{ minWidth: '10em' }}
                            label='Group Execution'
                            size='small'
                            onChange={e => group.setMultiRunExecution(e.target.value as GroupExecution)}
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
                            value={group.execution}
                            disabled={isUsingSeedData}
                            sx={{ minWidth: '10em' }}
                            size='small'
                            label='Group Item Execution'
                            onChange={e => group.setGroupExecution(e.target.value as GroupExecution)}
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