import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Grid2, ToggleButton, Stack } from '@mui/material'
import { WorkbookGroupExecution, WorkbookMethod, WorkbookMethods } from '@apicize/lib-typescript'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'

export const RequestInfoEditor = observer(() => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    if (workspace.active?.entityType !== EditableEntityType.Request) {
        return null
    }

    workspace.nextHelpTopic = 'requests/info'
    const request = workspace.active as EditableWorkbookRequest
    const execution = workspace.getExecution(request.id)

    const methodMenuItems = () => {
        return WorkbookMethods.map(method => (
            <MenuItem key={method} value={method}>{method}</MenuItem>
        ))
    }

    const updateRuns = (runs: number) => {
        workspace.setRequestRuns(runs)
    }

    const handleRunClick = () => async () => {
        try {
            await workspace.executeRequest(request.id)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    return (
        <Grid2 container direction='column' spacing={3} maxWidth='60em'>
            <Grid2>
                <TextField
                    id='request-name'
                    label="Name"
                    aria-label='request name'
                    required
                    // size="small"
                    value={request.name}
                    onChange={e => workspace.setName(e.target.value)}
                    error={request.nameInvalid}
                    helperText={request.nameInvalid ? 'Request name is required' : ''}
                    fullWidth
                />
            </Grid2>
            <Grid2>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='request url'
                    required
                    // size="small"
                    value={request.url}
                    onChange={e => workspace.setRequestUrl(e.target.value)}
                    error={request.urlInvalid}
                    helperText={request.urlInvalid ? 'URL must include http/https protocol prefix and address' : ''}
                    fullWidth
                />
            </Grid2>
            <Grid2>
                <Stack display='flex' direction='row' justifyItems='center'>
                    <FormControl>
                        <InputLabel id='request-method-label-id'>Method</InputLabel>
                        <Select
                            labelId='request-method-label-id'
                            aria-labelledby='request-method-label-id'
                            id="request-method"
                            value={request.method}
                            label="Method"
                            onChange={e => workspace.setRequestMethod(e.target.value as WorkbookMethod)}
                        >
                            {methodMenuItems()}
                        </Select>
                    </FormControl>
                    <FormControl>
                        <TextField
                            aria-label='request timeout in milliseconds'
                            placeholder='Timeout in Milliseconds'
                            label='Timeout'
                            sx={{ marginLeft: '24px', width: '8em' }}
                            type='number'
                            value={request.timeout}
                            onChange={e => workspace.setRequestTimeout(parseInt(e.target.value))}
                        />
                    </FormControl>
                </Stack>
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
                        value={request.runs}
                        onChange={e => updateRuns(parseInt(e.target.value))}
                    />
                    <ToggleButton value='Run' title='Run selected request' disabled={execution.running} onClick={handleRunClick()} sx={{marginRight: '2em'}}>
                        <PlayCircleFilledIcon color={execution.running ? 'disabled' : 'success'} />
                    </ToggleButton>
                    <FormControl>
                    <InputLabel id='multirun-execution-label-id'>Multiple Run Execution Mode</InputLabel>
                    <Select
                        labelId='execution-label-id'
                        id='multi-run-execution'
                        aria-labelledby='multirun-execution-label-id'
                        value={request.multiRunExecution}
                        sx={{ width: '14em' }}
                        label='Multiple Run Execution Mode'
                        onChange={e => workspace.setMultiRunExecution(e.target.value as WorkbookGroupExecution)}
                    >
                        <MenuItem value={WorkbookGroupExecution.Sequential}>Sequential</MenuItem>
                        <MenuItem value={WorkbookGroupExecution.Concurrent}>Concurrent</MenuItem>
                    </Select>
                </FormControl>

                </Stack>
            </Grid2>
        </Grid2>
    )
})
