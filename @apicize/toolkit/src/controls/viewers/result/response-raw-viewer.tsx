import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useClipboard } from "../../../contexts/clipboard.context";
import { RichViewer } from "../rich-viewer";
import { EditorMode } from "../../../models/editor-mode";
import { base64Encode } from "../../../services/base64";
import { ResultEditSessionType } from "../../editors/editor-types";
import { useWorkspace } from "../../../contexts/workspace.context";
import { useFeedback } from "../../../contexts/feedback.context";
import { ApicizeBody } from "@apicize/lib-typescript";
import { useState } from "react";
import { Execution } from "../../../models/workspace/execution";

export function ResultRawPreview(props: { execution: Execution }) {

    const workspace = useWorkspace()
    const feedback = useFeedback()
    const clipboard = useClipboard()

    const updateKey = `${props.execution.requestOrGroupId}-${props.execution.resultIndex}-${props.execution.lastExecuted}`

    const [body, setBody] = useState<ApicizeBody | null>(null)
    const [currentUpdateKey, setCurrentUpdateKey] = useState('')

    if (!body || updateKey !== currentUpdateKey) {
        workspace.getExecutionResultDetail(props.execution.requestOrGroupId, props.execution.resultIndex)
            .then(details => {
                setBody((details.entityType === 'request' && details.response?.body)
                    ? details.response.body
                    : {
                        type: 'Text',
                        text: ''
                    })
                setCurrentUpdateKey(updateKey)
            }).catch(e => feedback.toastError(e))
        return
    }

    let isBinary: boolean
    let text: string
    switch (body?.type) {
        case 'Binary':
            isBinary = true
            text = base64Encode(body.data)
            break
        default:
            isBinary = false
            text = body.text
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
                                clipboard.writeTextToClipboard(body.text)
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
                            <RichViewer id={props.execution.requestOrGroupId} index={props.execution.resultIndex} type={ResultEditSessionType.Base64} text={text} wrap={true} mode={EditorMode.txt} sx={{ width: '100%', height: '100%' }} />
                        </>
                    )
                    : (
                        <RichViewer id={props.execution.requestOrGroupId} index={props.execution.resultIndex} type={ResultEditSessionType.Raw} text={text} mode={EditorMode.txt} wrap={true} sx={{ width: '100%', height: '100%' }} />
                    )
            }
        </Stack>
    )
}
