import { ImageViewer, KNOWN_IMAGE_EXTENSIONS } from "../image-viewer";
import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { useClipboard } from "../../../contexts/clipboard.context";
import { EditorMode } from "../../../models/editor-mode";
import { RichViewer } from "../rich-viewer";
import { ResultEditSessionType } from "../../editors/editor-types";
import { ApicizeBody } from "@apicize/lib-typescript";
import { useState } from "react";
import { useWorkspace } from "../../../contexts/workspace.context";
import { useFeedback } from "../../../contexts/feedback.context";
import { Execution } from "../../../models/workspace/execution";

export function ResultResponsePreview(props: { execution: Execution }) {

    const workspace = useWorkspace()
    const feedback = useFeedback()
    const clipboard = useClipboard()

    const updateKey = `${props.execution.requestOrGroupId}-${props.execution.resultIndex}-${props.execution.lastExecuted}`

    const [body, setBody] = useState<ApicizeBody | null>(null)
    const [extension, setExtension] = useState<string | null>(null)
    const [currentUpdateKey, setCurrentUpdateKey] = useState('')

    if (!body || updateKey !== currentUpdateKey) {
        workspace.getExecutionResultDetail(props.execution.requestOrGroupId, props.execution.resultIndex, false)
            .then(details => {
                setBody((details.entityType === 'request' && details.testContext.response?.body)
                    ? details.testContext.response.body
                    : {
                        type: 'Text',
                        text: ''
                    })

                const headers = details.entityType === 'request' && details.testContext.response?.headers
                    ? new Map(Object.entries(details.testContext.response.headers))
                    : new Map()

                setCurrentUpdateKey(updateKey)

                for (const [name, value] of headers.entries()) {
                    if (name.toLowerCase() === 'content-type') {
                        let i = value.indexOf('/')
                        if (i !== -1) {
                            let j = value.indexOf(';')
                            setExtension(value.substring(i + 1, j == -1 ? undefined : j))
                        }
                    }
                }

            }).catch(e => feedback.toastError(e))
        return
    }

    let image: Uint8Array = new Uint8Array()
    let text: string = ''

    switch (body.type) {
        case 'Binary':
            if (extension && KNOWN_IMAGE_EXTENSIONS.indexOf(extension) !== -1 && body.data.length > 0) {
                image = body.data
            }
            break
        case 'JSON':
            text = beautify.js_beautify(JSON.stringify(body.data), {})
            break
        default:
            switch (extension) {
                case 'html':
                    text = beautify.html_beautify(body.text, {})
                    break
                case 'css':
                    text = beautify.css_beautify(body.text, {})
                    break
                case 'js':
                    text = beautify.js_beautify(body.text, {})
                    break
                case 'json':
                    text = beautify.js_beautify(body.text, {})
                    break
                default:
                    text = body.text
            }
    }

    let hasImage = image.length > 0
    let hasText = text.length > 0

    let viewer
    if (hasImage && extension) {
        viewer = (<ImageViewer data={image} extensionToRender={extension} />)
    } else if (hasText) {
        let mode: EditorMode | undefined
        switch (extension) {
            case 'json':
                mode = EditorMode.json
                break
            case 'xml':
                mode = EditorMode.xml
                break
                break
            case 'html':
            case 'htm':
                mode = EditorMode.html
                break
            case 'css':
                mode = EditorMode.css
                break
            case 'txt':
            case 'text':
            default:
                mode = EditorMode.txt
        }

        viewer = <RichViewer
            id={props.execution.requestOrGroupId}
            index={props.execution.resultIndex}
            type={ResultEditSessionType.Preview}
            mode={mode}
            text={text}
            beautify={true}
            wrap={true}
            sx={{ width: '100%', height: '100%' }}
        />
    } else {
        <></>
    }

    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', width: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div' aria-label="response body preview">
                Response Body (Preview)
                {hasImage
                    ? (<IconButton
                        aria-label="copy image to clipboard"
                        title="Copy Image to Clipboard"
                        color='primary'
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => clipboard.writeImageToClipboard(image)}>
                        <ContentCopyIcon />
                    </IconButton>)
                    : hasText
                        ? (<IconButton
                            aria-label="copy text to clipboard"
                            title="Copy Text to Clipboard"
                            color='primary'
                            sx={{ marginLeft: '16px' }}
                            onClick={_ => clipboard.writeTextToClipboard(text)}>
                            <ContentCopyIcon />
                        </IconButton>)
                        : (<></>)
                }

            </Typography>
            {viewer}
        </Stack>
    )
}
