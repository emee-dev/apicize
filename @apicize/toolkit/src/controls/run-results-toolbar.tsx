import { FormControl, InputLabel, Select, MenuItem, Box, IconButton } from "@mui/material";
import { Stack, SxProps } from "@mui/material";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "../contexts/workspace.context";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { EditableRequestEntry } from "../models/workspace/editable-request-entry";

export const RunResultsToolbar = observer((props: { className?: string, sx?: SxProps, requetEntry: EditableRequestEntry }) => {
    const workspace = useWorkspace()
    const requestId = props.requetEntry.id
    const execution = workspace.getExecution(requestId)
    const result = workspace.getExecutionResult(requestId, execution.resultIndex)

    const updateSelectedResult = (index: number) => {
        workspace.changeResultIndex(requestId, index)
    }

    const length = execution.results.length
    const index = execution.resultIndex
    const parentIndex = result?.info.parentIndex

    const disableUp = index == 0
    const disableDown = index >= length - 1

    return <Stack direction='row' className={props.className} sx={props.sx} paddingTop='0.25em' paddingBottom='1.5em' display='flex' justifyContent='center'>
        {
            length > 1
                ? <FormControl>
                    <InputLabel id='run-id'>Results</InputLabel>
                    <Select
                        labelId='run-id'
                        id='run'
                        disabled={execution.running}
                        label='Results'
                        sx={{ minWidth: '10em' }}
                        size='small'
                        value={index.toString()}
                        onChange={e => updateSelectedResult(parseInt(e.target.value))}
                    >
                        {
                            execution.resultMenu.map((run, index) =>
                            (
                                <MenuItem key={`run-${index}`} sx={{ paddingLeft: `${1 + run.level * 1.5}em`, paddingRight: '24px', lineHeight: '1.1' }} value={index}>{run.title}</MenuItem>)
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