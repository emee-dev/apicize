import { FormControl, InputLabel, Select, MenuItem, Box, IconButton } from "@mui/material";
import { Stack, SxProps } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "../contexts/workspace.context";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { Execution } from "../models/workspace/execution";
import { ExecutionResultSummary } from "@apicize/lib-typescript";
import { EditableEntityType } from "../models/workspace/editable-entity-type";

export const RunResultsToolbar = observer((props: {
    className?: string,
    sx?: SxProps,
    lastExecuted: number, // here just to force a refresh
}) => {
    const workspace = useWorkspace()

    const activeSelection = workspace.activeSelection
    if (!(activeSelection &&
        (activeSelection.type === EditableEntityType.Request || activeSelection?.type === EditableEntityType.Group)
    )) {
        return null
    }

    const execution = workspace.getExecution(activeSelection.id)
    if (!execution) {
        return null
    }

    const index = execution.resultIndex
    const length = execution.results.length
    const result = execution.results[index]
    const parentIndex = result?.parentIndex


    const disableUp = index == 0
    const disableDown = index >= length - 1

    const updateSelectedResult = (index: number) => {
        execution.changeResultIndex(index)
    }

    return <Stack direction='row' className={props.className} sx={props.sx} paddingTop='0.25em' paddingBottom='1.5em' display='flex' justifyContent='center'>
        {
            length > 1
                ? <FormControl>
                    <InputLabel id='run-id'>Results</InputLabel>
                    <Select
                        labelId='run-id'
                        id='run'
                        disabled={execution.isRunning}
                        label='Results'
                        sx={{ minWidth: '10em' }}
                        size='small'
                        value={index.toString()}
                        onChange={e => updateSelectedResult(parseInt(e.target.value))}
                    >
                        {
                            execution.results.map((run, index) =>
                            (
                                <MenuItem key={`run-${index}`} sx={{ paddingLeft: `${1 + run.level * 1.5}em`, paddingRight: '24px', lineHeight: '1.1' }} value={index}>{run.name}</MenuItem>)
                            )
                        }
                    </Select>
                </FormControl>
                : null
        }
        <Box display='flex' flexDirection='row' flexGrow={1} justifyContent='end'>
            <IconButton color='primary' title='View Previous Result' onClick={() => updateSelectedResult(index - 1)} disabled={disableUp}><ArrowUpwardIcon /></IconButton>
            <IconButton color='primary' title='View Next Result' onClick={() => updateSelectedResult(index + 1)} disabled={disableDown}><ArrowDownwardIcon /></IconButton>
            <IconButton color='primary' title='View Parent Result' onClick={() => updateSelectedResult(parentIndex ?? 0)} disabled={parentIndex === undefined}><KeyboardReturnIcon /></IconButton>
        </Box>
    </Stack>
})