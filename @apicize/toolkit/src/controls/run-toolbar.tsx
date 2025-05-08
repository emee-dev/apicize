import { ToggleButton, Box, Grid2, SvgIcon } from "@mui/material";
import { SxProps } from "@mui/material";
import { observer } from "mobx-react-lite";
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined'
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled'
import { EditableEntityType } from "../models/workspace/editable-entity-type";
import { useWorkspace, WorkspaceMode } from "../contexts/workspace.context";
import { ToastSeverity, useFeedback } from "../contexts/feedback.context";
import BlockIcon from '@mui/icons-material/Block';
import { NO_SELECTION_ID } from "../models/store";
import SeedIcon from "../icons/seed-icon";
import { EditableRequestEntry } from "../models/workspace/editable-request-entry";
import { useApicize } from "../contexts/apicize.context";

export const RunToolbar = observer((props: { sx?: SxProps, requestEntry: EditableRequestEntry }) => {
    const apicize = useApicize()
    const workspace = useWorkspace()
    const feedback = useFeedback()

    const requestId = props.requestEntry.id
    const execution = workspace.executions.get(requestId)
    const running = execution?.isRunning ?? false

    const handleRunClick = (singleRun: boolean = false) => async () => {
        try {
            await workspace.executeRequest(requestId, singleRun)
        } catch (e) {
            let msg1 = `${e}`
            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
        }
    }

    const handleCancel = async () => {
        try {
            await workspace.cancelRequest(requestId)
            feedback.toast('Request cancelled', ToastSeverity.Info)
        } catch (e) {
            feedback.toast(`Unable to cancel request - ${e}`, ToastSeverity.Error)
        }
    }

    const label = props.requestEntry.entityType === EditableEntityType.Group ? 'group' : 'request'

    let runDisplay: string
    let multiDisplay: string
    let cancelDisplay: string

    if (running) {
        runDisplay = 'none'
        multiDisplay = 'none'
        cancelDisplay = 'inline-flex'
    } else {
        runDisplay = 'inline-flex'
        multiDisplay = props.requestEntry.runs > 1 ? 'inline-flex' : 'none'
        cancelDisplay = 'none'
    }

    const seedingFrom = workspace.defaults.selectedData.id === NO_SELECTION_ID ? undefined : workspace.defaults.selectedData;

    return (
        <Grid2 container direction={'row'} display='flex' flexGrow={1} marginLeft='2em' alignItems='center' justifyContent='space-between' sx={props.sx}>
            <Box>
                <ToggleButton value='Run' sx={{ display: runDisplay }} title={`Run selected ${label} once (${apicize.ctrlKey}-Enter)`} size='small' disabled={running} onClick={handleRunClick(true)}>
                    <PlayCircleOutlined color={running ? 'disabled' : 'success'} />
                </ToggleButton>
                <ToggleButton value='Multi' sx={{ display: multiDisplay }} title={`Run selected ${label} ${props.requestEntry.runs} time (${apicize.ctrlKey}-Shift-Enter)`} size='small' disabled={running} onClick={handleRunClick()}>
                    <PlayCircleFilledIcon color={(running) ? 'disabled' : 'success'} />
                </ToggleButton>
                <ToggleButton value='Cancel' sx={{ display: cancelDisplay }} title='Cancel' size='small' onClick={() => handleCancel()}>
                    <BlockIcon color='error' />
                </ToggleButton>
            </Box>
            <ToggleButton value='Seed' size='small' title={seedingFrom ? `Seeding from ${seedingFrom.name}` : 'Not Seeding Data'} onClick={() => workspace.setMode(WorkspaceMode.Seed)}>
                <SvgIcon className='seed-icon' color={seedingFrom ? 'success' : 'primary'}><SeedIcon /></SvgIcon>
            </ToggleButton>
        </Grid2>
    )
})