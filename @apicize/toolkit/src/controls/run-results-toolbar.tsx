import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Stack, SxProps } from "@mui/system";
import { observer } from "mobx-react-lite";
import { EditableEntityType } from "../models/workbook/editable-entity-type";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { useWorkspace } from "../contexts/workspace.context";

export const RunResultsToolbar = observer((props: { className?: string, sx?: SxProps }) => {
    const workspace = useWorkspace()
    const request = ((workspace.active?.entityType === EditableEntityType.Request || workspace.active?.entityType === EditableEntityType.Group)
        && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequest
        : null

    const requestId = request?.id ?? ''
    const execution = workspace.getExecution(requestId)

    const updateSelectedResult = (index: number) => {
        workspace.changeResultIndex(requestId, index)
    }

    return (
        <Stack direction='row' className={props.className} sx={props.sx}>
            {
                request && execution.results.size > 1
                    ? <FormControl sx={{ marginRight: '1em' }}>
                        <InputLabel id='run-id'>Runs</InputLabel>
                        <Select
                            labelId='run-id'
                            id='run'
                            disabled={execution.running}
                            label='Runs'
                            sx={{ minWidth: '10em' }}
                            value={execution.resultIndex.toString()}
                            onChange={e => updateSelectedResult(parseInt(e.target.value))}
                        >
                            {
                                execution.resultMenu.map((run, index) =>
                                (
                                    <MenuItem key={`run-${index}`} sx={{ marginLeft: `${run.level * 2}em` }} value={index}>{run.title}</MenuItem>)
                                )
                            }
                        </Select>
                    </FormControl>
                    : null
            }
        </Stack >
    )
})