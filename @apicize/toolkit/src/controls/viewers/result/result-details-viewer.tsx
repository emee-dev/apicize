import { IconButton, Typography } from "@mui/material"
import { Stack } from "@mui/material"
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import beautify from "js-beautify"
import { observer } from "mobx-react-lite"
import { useClipboard } from "../../../contexts/clipboard.context"
import { RichViewer } from "../rich-viewer"
import { EditorMode } from "../../../models/editor-mode"
import { ResultEditSessionType } from "../../../contexts/workspace-session.context"
import { ExecutionResult } from "../../../models/workspace/execution"

export const ResultDetailsViewer = observer((props: { result: ExecutionResult }) => {
    const clipboard = useClipboard()

    const result1 = JSON.parse(JSON.stringify(props.result))
    const result = {
        ...result1,
        info: undefined
    }

    const text = beautify.js_beautify(JSON.stringify(result), {})

    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>Details
                <IconButton
                    aria-label="copy deatils to clipboard"
                    title="Copy Details to Clipboard"
                    color='primary'
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => { if (text) clipboard.writeTextToClipboard(text) }}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            <RichViewer id={props.result.info.requestOrGroupId} index={props.result.info.index} type={ResultEditSessionType.Details} text={text} mode={EditorMode.json} beautify={true} wrap={true} sx={{ width: '100%', height: '100%' }} />
        </Stack>
    )
})
