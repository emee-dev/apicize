import { ImageViewer, KNOWN_IMAGE_EXTENSIONS } from "../image-viewer";
import { TextViewer } from "../text-viewer";
import { IconButton, Stack, Typography } from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";

export function ResultResponsePreview(props: {
    requestOrGroupId: string,
    runIndex: number,
    resultIndex: number,
}) {
    const workspace = useWorkspace()
    const clipboard = useClipboard()

    const headers = workspace.getExecutionResultHeaders(props.requestOrGroupId, props.runIndex, props.resultIndex)
    const body = workspace.getExecutionResultBody(props.requestOrGroupId, props.runIndex, props.resultIndex)

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

    return (
        <Stack sx={{ bottom: 0, overflow: 'hidden', position: 'relative', height: '100%', width: '100%', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div' aria-label="response body preview">
                Response Body (Preview)
                {showImageCopy
                    ? (<IconButton
                        aria-label="copy image to clipboard"
                        title="Copy Image to Clipboard"
                        sx={{ marginLeft: '16px' }}
                        onClick={_ => { if (body?.data) clipboard.writeImageToClipboard(body.data) } } >
                        <ContentCopyIcon />
                    </IconButton>)
                    : showTextCopy
                        ? (<IconButton
                            aria-label="copy text to clipboard"
                            title="Copy Text to Clipboard"
                            sx={{ marginLeft: '16px' }}
                            onClick={_ => clipboard.writeTextToClipboard(text)}>
                            <ContentCopyIcon />
                        </IconButton>)
                        : (<></>)
                }

            </Typography>
            {
                isImage && showImageCopy
                    ? (<ImageViewer base64ToRender={body?.data} extensionToRender={extension} />)
                    : (<TextViewer text={text} extension={extension} />)
            }
        </Stack>
    )
}
