import { IconButton, Typography } from "@mui/material"
import { Stack } from "@mui/material"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { observer } from "mobx-react-lite";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";
import { RichViewer } from "../rich-viewer";
import { EditorMode } from "../../../models/editor-mode";

export const ResultDetailsViewer = observer((props: { requestOrGroupId: string, index: number }) => {
    const workspace = useWorkspace()
    const clipboard = useClipboard()

    const result = workspace.getExecutionResult(props.requestOrGroupId, props.index)

    if (!result) {
        return null
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
            <RichViewer text={text} mode={EditorMode.json} beautify={true} wrap={true} sx={{ width: '100%', height: '100%' }} />
        </Stack>
    )
})
