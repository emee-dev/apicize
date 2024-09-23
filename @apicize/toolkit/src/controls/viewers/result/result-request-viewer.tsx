import { TextViewer } from "../text-viewer"
import { IconButton, Typography } from "@mui/material"
import { Stack } from "@mui/system"
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { observer } from "mobx-react-lite";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";

export const ResultRequestViewer = observer((props: {
    requestOrGroupId: string,
    runIndex: number,
    resultIndex: number,
}) => {
    const workspace = useWorkspace()
    const clipboard = useClipboard()

    const request = workspace.getExecutionRequest(props.requestOrGroupId, props.runIndex, props.resultIndex)
    const text = beautify.js_beautify(JSON.stringify(request), {})
    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>Request
                <IconButton
                    aria-label="copy request to clipboard"
                    title="Copy Request to Clipboard"
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => { if (text) clipboard.writeTextToClipboard(text) }}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            <TextViewer text={text} extension='json' />
        </Stack>
    )
})
