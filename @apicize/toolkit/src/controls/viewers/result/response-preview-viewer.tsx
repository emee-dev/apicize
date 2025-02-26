import { ImageViewer, KNOWN_IMAGE_EXTENSIONS } from "../image-viewer";
import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";
import { EditorMode } from "../../../models/editor-mode";
import { RichViewer } from "../rich-viewer";

export function ResultResponsePreview(props: { requestOrGroupId: string, index: number }) {
    const workspace = useWorkspace()
    const clipboard = useClipboard()

    const result = workspace.getExecutionResult(props.requestOrGroupId, props.index)
    if (!result?.execution?.response) {
        return null
    }

    const headers = result.execution.response.headers
    const body = result.execution.response.body

    let extension = ''
    for (const [name, value] of Object.entries(headers ?? {})) {
        if (name.toLowerCase() === 'content-type') {
            let i = value.indexOf('/')
            if (i !== -1) {
                let j = value.indexOf(';')
                extension = value.substring(i + 1, j == -1 ? undefined : j)
            }
        }
    }

    const isImage = KNOWN_IMAGE_EXTENSIONS.indexOf(extension) !== -1
    let text = body?.text ?? ''
    if ((!isImage) && text.length > 0) {
        switch (extension) {
            case 'html':
                text = beautify.html_beautify(text, {})
                break
            case 'css':
                text = beautify.css_beautify(text, {})
                break
            case 'js':
                text = beautify.js_beautify(text, {})
                break
            case 'json':
                text = beautify.js_beautify(text, {})
                break
            default:
                break
        }
    }

    const showImageCopy = isImage && ((body?.data?.length ?? 0) > 0)
    const showTextCopy = (!isImage) && ((text.length ?? 0) > 0)

    let viewer
    if (isImage && showImageCopy) {
        viewer = (<ImageViewer base64ToRender={body?.data} extensionToRender={extension} />)
    } else {
        let mode: EditorMode | undefined
        switch (extension) {
            case 'json':
                mode = EditorMode.json
                break
            case 'xml':
                mode = EditorMode.xml
                break
            case 'txt':
            case 'text':
                mode = EditorMode.txt
                break
            case 'html':
            case 'htm':
                mode = EditorMode.html
                break
            case 'css':
                mode = EditorMode.css
                break
        }

        viewer = <RichViewer
            mode={mode}
            text={text}
            beautify={true}
            sx={{ width: '100%', height: '100%' }}
        />
    }

    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', width: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div' aria-label="response body preview">
                Response Body (Preview)
                {showImageCopy
                    ? (<IconButton
                        aria-label="copy image to clipboard"
                        title="Copy Image to Clipboard"
                        color='primary'
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => { if (body?.data) clipboard.writeImageToClipboard(body.data) }} >
                        <ContentCopyIcon />
                    </IconButton>)
                    : showTextCopy
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
