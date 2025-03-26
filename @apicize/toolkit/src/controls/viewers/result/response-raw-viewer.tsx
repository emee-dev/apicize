import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useClipboard } from "../../../contexts/clipboard.context";
import { RichViewer } from "../rich-viewer";
import { EditorMode } from "../../../models/editor-mode";
import { ResultEditSessionType } from "../../../contexts/workspace-session.context";
import { base64Encode } from "../../../services/apicize-serializer";
import { ExecutionResult } from "../../../models/workspace/execution";

export function ResultRawPreview(props: { result: ExecutionResult }) {
    const clipboard = useClipboard()

    const body = props.result.response?.body

    let isBinary: boolean
    let text: string
    switch (body?.type) {
        case 'Binary':
            isBinary = true
            text = base64Encode(body.data)
            break
        case 'Text':
            isBinary = false
            text = body.data
            break
        case 'JSON':
            isBinary = false
            text = body.text
            break
        default:
            isBinary = false
            text = ''
            break

    }
    const hasData = text.length > 0

    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>Response Body (Raw)
                {hasData
                    ? (<IconButton
                        aria-label="copy data to clipboard"
                        title="Copy Data to Clipboard"
                        color='primary'
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => {
                            if (body?.type === 'Binary') {
                                clipboard.writeImageToClipboard(body.data)
                            } else if (body?.type === 'Text') {
                                clipboard.writeTextToClipboard(body.data)
                            }
                        }}>
                        <ContentCopyIcon />
                    </IconButton>)
                    : (<></>)
                }
            </Typography>
            {
                isBinary
                    ? (
                        <>
                            <Typography aria-label="base64 response data" variant='h3' sx={{ marginTop: 0 }} component='div'>Base 64</Typography>
                            <RichViewer id={props.result.info.requestOrGroupId} index={props.result.info.index} type={ResultEditSessionType.Base64} text={text} wrap={true} mode={EditorMode.txt} sx={{ width: '100%', height: '100%' }} />
                        </>
                    )
                    : (
                        <RichViewer id={props.result.info.requestOrGroupId} index={props.result.info.index} type={ResultEditSessionType.Raw} text={text} mode={EditorMode.txt} wrap={true} sx={{ width: '100%', height: '100%' }} />
                    )
            }
        </Stack>
    )
}
