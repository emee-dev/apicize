import { IconButton, Typography } from "@mui/material"
import { Stack } from "@mui/material"
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import beautify from "js-beautify"
import { observer } from "mobx-react-lite"
import { useClipboard } from "../../../contexts/clipboard.context"
import { RichViewer } from "../rich-viewer"
import { EditorMode } from "../../../models/editor-mode"
import { ResultEditSessionType } from "../../editors/editor-types"
import { ExecutionResultDetail, ExecutionResultSummary } from "@apicize/lib-typescript"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useFeedback } from "../../../contexts/feedback.context"
import { useState } from "react"
import { Execution } from "../../../models/workspace/execution"
import { base64Encode } from "../../../services/base64"

export const ResultDetailsViewer = observer((props: { execution: Execution }) => {

    const workspace = useWorkspace()
    const feedback = useFeedback()
    const clipboard = useClipboard()

    const requestOrGroupId = props.execution.requestOrGroupId
    const resultIndex = props.execution.resultIndex
    const updateKey = `${props.execution.requestOrGroupId}-${props.execution.resultIndex}-${props.execution.lastExecuted}`

    const [details, setDetails] = useState<ExecutionResultDetail | null>(null)
    const [currentUpdateKey, setCurrentUpdateKey] = useState('')

    if (!details || updateKey !== currentUpdateKey) {
        workspace.getExecutionResultDetail(requestOrGroupId, resultIndex)
            .then(d => {
                if (d.entityType === 'request' && d.request?.body?.type === 'Binary') {
                    //@ts-expect-error
                    d.request.body.data = base64Encode(d.request.body.data)
                    if (d.response?.body?.type === 'Binary') {
                        //@ts-expect-error
                        d.response.body.data = base64Encode(d.request.body.data)
                    }
                }
                setDetails({ ...d, entityType: undefined } as unknown as ExecutionResultDetail)
                setCurrentUpdateKey(updateKey)
            }).catch(e => feedback.toastError(e))
        return
    }



    const text = beautify.js_beautify(JSON.stringify(details), {})

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
            <RichViewer id={requestOrGroupId} index={resultIndex} type={ResultEditSessionType.Details} text={text} mode={EditorMode.json} beautify={true} wrap={true} sx={{ width: '100%', height: '100%' }} />
        </Stack>
    )
})
