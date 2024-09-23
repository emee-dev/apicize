import { ButtonGroup, ToggleButton, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Grid2 } from "@mui/material";
import { Stack } from "@mui/system";
import { observer } from "mobx-react-lite";
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { EditableEntityType } from "../models/workbook/editable-entity-type";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { useWorkspace } from "../contexts/workspace.context";
import { ToastSeverity, useFeedback } from "../contexts/feedback.context";

export const RunToolbar = observer(() => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    
    const request = ((workspace.active?.entityType === EditableEntityType.Request || workspace.active?.entityType === EditableEntityType.Group)
        && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequest
        : null

    const requestId = request?.id ?? ''
    const execution = workspace.getExecution(requestId)

    if (! request) {
        return null
    }

    const updateRuns = (runs: number) => {
        workspace.setRequestRuns(runs)
    }

    const updateSelectedRun = (index: number) => {
        workspace.changeRunIndex(requestId, index)
    }

    const updateSelectedResult = (index: number) => {
        workspace.changeResultIndex(requestId, index)
    }

    const handleRunClick = () => async () => {
        try {
            if (! (workspace.active && (workspace.active.entityType === EditableEntityType.Request || workspace.active.entityType === EditableEntityType.Group))) {
                return
            }
            const requestId = workspace.active.id
            await workspace.executeRequest(requestId)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    return (
        <Stack direction={'row'} sx={{ flexGrow: 0 }}>
            <ButtonGroup
                sx={{ marginRight: '24px' }}
                orientation='vertical'
                aria-label="request run context">
                <ToggleButton value='Run' title='Run selected request' disabled={execution.running} onClick={handleRunClick()}>
                    <PlayCircleFilledIcon />
                </ToggleButton>
            </ButtonGroup>

            <Grid2 container direction={'row'} spacing={3}>
                <Grid2>
                    <TextField
                        aria-label='Nubmer of Run Attempts'
                        placeholder='Attempts'
                        label='# of Runs'
                        disabled={execution.running}
                        sx={{ width: '8em', flexGrow: 0 }}
                        type='number'
                        InputProps={{
                            inputProps: {
                                min: 1, max: 1000
                            }
                        }}

                        value={request.runs}
                        onChange={e => updateRuns(parseInt(e.target.value))}
                    />
                </Grid2>
                {
                    execution.runs.length > 1
                        ? <Grid2>
                            <FormControl>
                                <InputLabel id='run-id'>Runs</InputLabel>
                                <Select
                                    labelId='run-id'
                                    id='run'
                                    disabled={execution.running}
                                    label='Run'
                                    sx={{ minWidth: '10em' }}
                                    value={execution.runIndex.toString()}
                                    onChange={e => updateSelectedRun(parseInt(e.target.value))}
                                >
                                    {
                                        execution.runs.map((run, index) =>
                                        (
                                            <MenuItem key={`run-${index}`} value={index}>{run.title}</MenuItem>)
                                        )
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>
                        : <></>
                }
                {
                    execution.runs.length > 0 && execution.runs.at(execution.runIndex)?.groupSummary
                        ? <Grid2>
                            <FormControl>
                                <InputLabel id='result-id'>Results</InputLabel>
                                <Select
                                    labelId='results-id'
                                    id='result'
                                    value={execution.resultIndex.toString()}
                                    disabled={execution.running}
                                    label='Run'
                                    sx={{ minWidth: '10em' }}
                                    onChange={e => updateSelectedResult(parseInt(e.target.value))}
                                >
                                    {
                                        execution.runs.at(execution.runIndex)?.results?.map((run, index) => (
                                            <MenuItem key={`result-${index}`} value={run.index}>{run.title}</MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>
                        </Grid2>
                        : <></>
                }
            </Grid2>
        </Stack>
    )
})