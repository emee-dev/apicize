import { ToggleButton, Button, Box, Grid2, Link, SvgIcon, IconButton, FormControl } from "@mui/material";
import { SxProps } from "@mui/material";
import { observer } from "mobx-react-lite";
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { EditableEntityType } from "../models/workspace/editable-entity-type";
import { EditableRequest } from "../models/workspace/editable-request";
import { useWorkspace } from "../contexts/workspace.context";
import { ToastSeverity, useFeedback } from "../contexts/feedback.context";
import BlockIcon from '@mui/icons-material/Block';
import { NO_SELECTION_ID } from "../models/store";
import SeedIcon from "../icons/seed-icon";

export const RunToolbar = observer((props: { sx?: SxProps }) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    const entityType = workspace.active?.entityType
    const request = (entityType === EditableEntityType.Request || entityType === EditableEntityType.Group)
        ? workspace.active as EditableRequest
        : null

    const requestId = request?.id ?? ''
    const execution = workspace.executions.get(requestId)
    const running = execution?.running ?? false

    if (!request) {
        return null
    }

    const handleRunClick = (singleRun: boolean = false) => async () => {
        try {
            if (!(workspace.active && (workspace.active.entityType === EditableEntityType.Request || workspace.active.entityType === EditableEntityType.Group))) {
                return
            }
            const requestId = workspace.active.id
            await workspace.executeRequest(requestId, singleRun)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    const handleCancel = async () => {
        if (workspace.active?.id) {
            try {
                await workspace.cancelRequest(workspace.active?.id)
                feedback.toast('Request cancelled', ToastSeverity.Info)
            } catch (e) {
                feedback.toast(`Unable to cancel request - ${e}`, ToastSeverity.Error)
            }
        }
    }

    const label = entityType === EditableEntityType.Group ? 'group' : 'request'

    let runDisplay: string
    let multiDisplay: string
    let cancelDisplay: string

    if (running) {
        runDisplay = 'none'
        multiDisplay = 'none'
        cancelDisplay = 'inline-flex'
    } else {
        runDisplay = 'inline-flex'
        multiDisplay = request.runs > 1 ? 'inline-flex' : 'none'
        cancelDisplay = 'none'
    }

    return (
        <Grid2 container direction={'row'} display='flex' flexGrow={1} marginLeft='2em'  alignItems='center' justifyContent='space-between' sx={props.sx}>
            <Box>
                <ToggleButton value='Run' sx={{display: runDisplay}} title={`Run selected ${label} once (${workspace.ctrlKey}-Enter)`} size='small' disabled={running} onClick={handleRunClick(true)}>
                    <PlayCircleOutlined color={running ? 'disabled' : 'success'} />
                </ToggleButton>
                <ToggleButton value='Multi' sx={{ display: multiDisplay }}  title={`Run selected ${label} ${request.runs} time (${workspace.ctrlKey}-Shift-Enter)`} size='small' disabled={running} onClick={handleRunClick()}>
                    <PlayCircleFilledIcon color={(running) ? 'disabled' : 'success'} />
                </ToggleButton>
                <ToggleButton value='Cancel' sx={{ display: cancelDisplay }}  title='Cancel' size='small' onClick={() => handleCancel()}>
                    <BlockIcon color='error' />
                </ToggleButton>
            </Box>
            {
                workspace.defaults.selectedData.id !== NO_SELECTION_ID
                    ? <ToggleButton value='Seed' size='small' title={`Seeding from ${workspace.defaults.selectedData.name}`} onClick={() => workspace.changeActive(EditableEntityType.Workbook, 'defaults')}><SvgIcon className='seed-icon' color='success'><SeedIcon /></SvgIcon></ToggleButton>
                    : <ToggleButton value='NoSeed' size='small' title='Not Seeding Data' onClick={() => workspace.changeActive(EditableEntityType.Workbook, 'defaults')}><SvgIcon className='seed-icon' color='primary'><SeedIcon /></SvgIcon></ToggleButton>
            }
        </Grid2>
    )
})