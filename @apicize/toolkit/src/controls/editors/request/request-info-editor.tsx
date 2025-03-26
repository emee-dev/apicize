import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Grid2, ToggleButton, Stack } from '@mui/material'
import { GroupExecution, Method, Methods } from '@apicize/lib-typescript'
import { EditableEntityType } from '../../../models/workspace/editable-entity-type'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { useWorkspaceSession } from '../../../contexts/workspace-session.context'

export const RequestInfoEditor = observer((props: { request: EditableRequest }) => {
    const workspace = useWorkspace()
    const session = useWorkspaceSession()
    const feedback = useFeedback()

    session.nextHelpTopic = 'requests/info'
    const execution = workspace.executions.get(props.request.id)
    const running = execution?.running ?? false

    const methodMenuItems = () => {
        return Methods.map(method => (
            <MenuItem key={method} value={method}>{method}</MenuItem>
        ))
    }

    const handleRunClick = () => async () => {
        try {
            await workspace.executeRequest(props.request.id)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    return (
        <Grid2 container direction='column' spacing={3}>
            <Grid2>
                <TextField
                    id='request-name'
                    label="Name"
                    aria-label='request name'
                    required
                    size="small"
                    value={props.request.name}
                    onChange={e => props.request.setName(e.target.value)}
                    error={props.request.nameInvalid}
                    helperText={props.request.nameInvalid ? 'Request name is required' : ''}
                    fullWidth
                />
            </Grid2>
            <Grid2>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='request url'
                    autoFocus
                    required
                    size="small"
                    value={props.request.url}
                    onChange={e => props.request.setUrl(e.target.value)}
                    error={props.request.urlInvalid}
                    helperText={props.request.urlInvalid ? 'URL is required' : ''}
                    fullWidth
                />
            </Grid2>
            <Grid2 container direction='row' spacing={2}>
                <Grid2>
                    <FormControl>
                        <InputLabel id='request-method-label-id'>Method</InputLabel>
                        <Select
                            labelId='request-method-label-id'
                            aria-labelledby='request-method-label-id'
                            id="request-method"
                            value={props.request.method}
                            onChange={e => props.request.setMethod(e.target.value as Method)}
                            size='small'
                            label="Method"
                        >
                            {methodMenuItems()}
                        </Select>
                    </FormControl>
                </Grid2>
                <Grid2>
                    <FormControl>
                        <TextField
                            aria-label='request timeout in milliseconds'
                            placeholder='Timeout in Milliseconds'
                            label='Timeout (ms)'
                            size='small'
                            sx={{ width: '8em' }}
                            type='number'
                            value={props.request.timeout}
                            onChange={e => props.request.setTimeout(parseInt(e.target.value))}
                        />
                    </FormControl>
                </Grid2>
            </Grid2>
            <Grid2 container direction='row' spacing={2}>
                <Grid2 container direction='row' spacing={0}>
                    <TextField
                        aria-label='Nubmer of Run Attempts'
                        placeholder='Attempts'
                        label='# of Runs'
                        disabled={running}
                        size='small'
                        sx={{ width: '8em', flexGrow: 0 }}
                        type='number'
                        slotProps={{
                            htmlInput: {
                                min: 1,
                                max: 1000
                            }
                        }}
                        value={props.request.runs}
                        onChange={e => props.request.setRuns(parseInt(e.target.value))}
                    />
                    <ToggleButton value='Run' title={`Run selected request ${props.request.runs} times`} disabled={running} size='small' onClick={handleRunClick()}>
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
                            value={props.request.multiRunExecution}
                            disabled={props.request.runs < 2}
                            size='small'
                            sx={{ minWidth: '10em' }}
                            label='Multi-Run Execution'
                            onChange={e => props.request.setMultiRunExecution(e.target.value as GroupExecution)}
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
