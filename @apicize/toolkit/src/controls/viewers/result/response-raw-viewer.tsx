import { TextViewer } from "../text-viewer";
import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";

export function ResultRawPreview(props: { requestOrGroupId: string, index: number }) {
    const workspace = useWorkspace()
    const clipboard = useClipboard()

    const result = workspace.getExecutionResult(props.requestOrGroupId, props.index)

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
                    sx={{ marginLeft: '16px' }}
                    onClick={_ => { if (preview) clipboard.writeTextToClipboard(preview) }}>
                    <ContentCopyIcon />
                </IconButton>)
                : (<></>)
            }
            </Typography>
            {has_text
                ? (<TextViewer text={preview} extension='txt' />)
                : (<><Typography aria-label="base64 response data" variant='h3' sx={{ marginTop: 0 }} component='div'>Base 64</Typography><TextViewer text={preview} extension='txt' /></>)
            }
        </Stack>
    )
}
