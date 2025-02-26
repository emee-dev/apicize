import { FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";
import { Stack, SxProps } from "@mui/material";
import { observer } from "mobx-react-lite";
import { EditableEntityType } from "../models/workspace/editable-entity-type";
import { EditableRequest } from "../models/workspace/editable-request";
import { useWorkspace } from "../contexts/workspace.context";

export const RunResultsToolbar = observer((props: { className?: string, sx?: SxProps }) => {
    const workspace = useWorkspace()
    const request = (workspace.active?.entityType === EditableEntityType.Request || workspace.active?.entityType === EditableEntityType.Group)
        ? workspace.active as EditableRequest
        : null

    const requestId = request?.id ?? ''
    const execution = workspace.getExecution(requestId)

    const updateSelectedResult = (index: number) => {
        workspace.changeResultIndex(requestId, index)
    }

    return (
        <Stack direction='row' className={props.className} sx={props.sx}>
            {
                request && execution.results.length > 1
                    ? <FormControl sx={{ marginRight: '1em' }}>
                        <InputLabel id='run-id'>Runs</InputLabel>
                        <Select
                            labelId='run-id'
                            id='run'
                            disabled={execution.running}
                            label='Runs'
                            sx={{ minWidth: '10em' }}
                            size='small'
                            value={execution.resultIndex.toString()}
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
        </Stack >
    )
})