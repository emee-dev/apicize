import { FormControl, InputLabel, Select, MenuItem, Grid2 } from "@mui/material";
import { Stack, SxProps } from "@mui/system";
import { observer } from "mobx-react-lite";
import { EditableEntityType } from "../models/workbook/editable-entity-type";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { useWorkspace } from "../contexts/workspace.context";
import { useFeedback } from "../contexts/feedback.context";

export const RunResultsToolbar = observer((props: { sx?: SxProps }) => {
    const workspace = useWorkspace()
    const request = ((workspace.active?.entityType === EditableEntityType.Request || workspace.active?.entityType === EditableEntityType.Group)
        && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequest
        : null

    const requestId = request?.id ?? ''
    const execution = workspace.getExecution(requestId)

    if (!request) {
        return null
    }

    const updateSelectedRun = (index: number) => {
        workspace.changeRunIndex(requestId, index)
    }

    const updateSelectedResult = (index: number) => {
        workspace.changeResultIndex(requestId, index)
    }


    return (
        <Stack direction='row' alignItems='center' sx={props.sx}>
            {
                execution.runs.length > 1
                    ? <FormControl sx={{marginRight: '1em'}}>
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
                    : null
            }
            {
                execution.runs.length > 0 && (execution.runs.at(execution.runIndex)?.results.length ?? 0) > 1
                    ? <FormControl>
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
                    : <></>
            }
        </Stack >
    )
})