import { ToggleButton, TextField } from "@mui/material";
import { Stack, SxProps } from "@mui/system";
import { observer } from "mobx-react-lite";
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { EditableEntityType } from "../models/workbook/editable-entity-type";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { useWorkspace } from "../contexts/workspace.context";
import { ToastSeverity, useFeedback } from "../contexts/feedback.context";

export const RunToolbar = observer((props: { sx?: SxProps }) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    const request = ((workspace.active?.entityType === EditableEntityType.Request || workspace.active?.entityType === EditableEntityType.Group)
        && !workspace.helpVisible)
        ? workspace.active as EditableWorkbookRequest
        : null

    const requestId = request?.id ?? ''
    const execution = workspace.getExecution(requestId)

    if (!request) {
        return null
    }

    const handleRunClick = () => async () => {
        try {
            if (!(workspace.active && (workspace.active.entityType === EditableEntityType.Request || workspace.active.entityType === EditableEntityType.Group))) {
                return
            }
            const requestId = workspace.active.id
            await workspace.executeRequest(requestId, 1)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    return (
        <Stack direction={'row'} flexGrow={0} sx={props.sx}>
            <ToggleButton value='Run' title='Run selected request' sx={{ marginRight: '1em' }} disabled={execution.running} onClick={handleRunClick()}>
                <PlayCircleFilledIcon color={execution.running ? 'disabled' : 'success'} />
            </ToggleButton>
        </Stack>
    )
})