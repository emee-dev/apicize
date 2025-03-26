import { ImageViewer, KNOWN_IMAGE_EXTENSIONS } from "../image-viewer";
import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { useClipboard } from "../../../contexts/clipboard.context";
import { EditorMode } from "../../../models/editor-mode";
import { RichViewer } from "../rich-viewer";
import { ResultEditSessionType } from "../../../contexts/workspace-session.context";
import { ExecutionResult } from "../../../models/workspace/execution";

export function ResultResponsePreview(props: { result: ExecutionResult }) {
    const clipboard = useClipboard()

    const headers = props.result.response?.headers
    const body = props.result.response?.body

    debugger

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

    let image: Uint8Array = new Uint8Array()
    let text: string = ''

    switch (body?.type) {
        case 'Binary':
            if (KNOWN_IMAGE_EXTENSIONS.indexOf(extension) !== -1 && body.data.length > 0) {
                image = body.data
            }
            break
        case 'JSON':
            text = beautify.js_beautify(JSON.stringify(body.data), {})
            break
        case 'Text':
            switch (extension) {
                case 'html':
                    text = beautify.html_beautify(body.data, {})
                    break
                case 'css':
                    text = beautify.css_beautify(body.data, {})
                    break
                case 'js':
                    text = beautify.js_beautify(body.data, {})
                    break
                case 'json':
                    text = beautify.js_beautify(body.data, {})
                    break
                default:
                    text = body.data
            }
    }

    let hasImage = image.length > 0
    let hasText = text.length > 0

    let viewer
    if (hasImage) {
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
            id={props.result.info.requestOrGroupId}
            index={props.result.info.index}
            type={ResultEditSessionType.Preview}
            mode={mode}
            text={text}
            beautify={true}
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
