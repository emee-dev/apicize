import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";
import { RichViewer } from "../rich-viewer";
import { EditorMode } from "../../../models/editor-mode";

export function ResultRawPreview(props: { requestOrGroupId: string, executionResultId: string }) {
    const workspace = useWorkspace()
    const clipboard = useClipboard()

    const result = workspace.getExecutionResult(props.requestOrGroupId, props.executionResultId)

    if (result?.type !== 'request') {
        return null
    }

    const body = result.response?.body

    let has_text = body?.text !== undefined
    let preview = has_text ? body?.text : body?.data
    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>Response Body (Raw)
                {(preview?.length ?? 0) > 0
                    ? (<IconButton
                        aria-label="copy data to clipboard"
                        title="Copy Data to Clipboard"
                        color='primary'
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => { if (preview) clipboard.writeTextToClipboard(preview) }}>
                        <ContentCopyIcon />
                    </IconButton>)
                    : (<></>)
                }
            </Typography>
            {has_text
                ? (<RichViewer text={preview || ''} mode={EditorMode.txt} wrap={true} sx={{ width: '100%', height: '100%' }} />)
                : (<><Typography aria-label="base64 response data" variant='h3' sx={{ marginTop: 0 }} component='div'>Base 64</Typography><RichViewer text={preview || ''} wrap={true} mode={EditorMode.txt} /></>)
            }
        </Stack>
    )
}
