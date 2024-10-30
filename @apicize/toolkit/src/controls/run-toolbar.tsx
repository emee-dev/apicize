import { ToggleButton, TextField, Button } from "@mui/material";
import { Stack, SxProps } from "@mui/system";
import { observer } from "mobx-react-lite";
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined'
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
    const execution = workspace.executions.get(requestId)
    const running = execution?.running ?? false

    if (!request) {
        return null
    }

    const handleRunClick = (runs?: number) => async () => {
        try {
            if (!(workspace.active && (workspace.active.entityType === EditableEntityType.Request || workspace.active.entityType === EditableEntityType.Group))) {
                return
            }
            const requestId = workspace.active.id
            await workspace.executeRequest(requestId, runs)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    const handleCancel = async () => {
        if (workspace.active?.id) {
            try {
                await workspace.cancelRequest(workspace.active?.id)
                feedback.toast('Request cancelled', ToastSeverity.Success)
            } catch (e) {
                feedback.toast(`Unable to cancel request - ${e}`, ToastSeverity.Error)
            }
        }
    }

    return (
        <Stack direction={'row'} flexGrow={0} sx={props.sx}>
            <ToggleButton value='Run' title='Run selected request once' sx={{ marginRight: '1em' }} size='small' disabled={running} onClick={handleRunClick()}>
                <PlayCircleOutlined color={running ? 'disabled' : 'success'} />
            </ToggleButton>
            {
                request.runs > 1
                    ? <ToggleButton value='Run' title={`Run selected request ${request.runs} times`} sx={{ marginRight: '1em' }} size='small' disabled={running} onClick={handleRunClick()}>
                        <PlayCircleFilledIcon color={(running) ? 'disabled' : 'success'} />
                    </ToggleButton>
                    : null
            }
            {
                running
                    ? <Button aria-label='cancel execution' variant='outlined' color='error' onClick={() => handleCancel()} size='small'>Cancel</Button>
                    : null
            }
        </Stack>
    )
})