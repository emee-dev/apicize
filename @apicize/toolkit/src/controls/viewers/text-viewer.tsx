import { Typography } from "@mui/material";
import { Grammar, highlight, languages } from 'prismjs'

import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-json"
import "ace-builds/src-noconflict/mode-xml"
import "ace-builds/src-noconflict/mode-html"
import "ace-builds/src-noconflict/mode-css"
import "ace-builds/src-noconflict/mode-text"
import "ace-builds/src-noconflict/theme-gruvbox"
import "ace-builds/src-noconflict/theme-chrome"
import "ace-builds/src-noconflict/ext-language_tools"
import "ace-builds/src-noconflict/ext-searchbox"

import { observer } from "mobx-react-lite";
import { useApicizeSettings } from "../../contexts/apicize-settings.context";

export const MAX_TEXT_RENDER_LENGTH = 64 * 1024 * 1024

export const TextViewer = observer((props: { text?: string, extension?: string }) => {
    const apicizeSettings = useApicizeSettings()

    const length = props.text?.length ?? 0
    if (!(props.text && length > 0)) {
        return null
    }

    let render = props.text
    if (length > MAX_TEXT_RENDER_LENGTH) {
        if (props.extension === 'txt') {
            render = render.substring(0, MAX_TEXT_RENDER_LENGTH) + '[...]'
        } else {
            return (<Typography variant='h3' style={{ marginTop: 0 }} component='div'>Sorry, the text length exceeds that which can be rendered</Typography>)
        }
    }

    let mode = props.extension
    if (mode === 'txt') mode = 'text'

    return <AceEditor
        mode={mode}
        theme={apicizeSettings.colorScheme === 'dark' ? 'gruvbox' : 'chrome'}
        fontSize={`${apicizeSettings.fontSize}pt`}
        lineHeight='1.1em'
        width='100%'
        height='100%'
        name='code-editor'
        showGutter={true}
        showPrintMargin={false}
        tabSize={3}
        editorProps={{ readOnly: true }}
        setOptions={{
            readOnly: true,
            useWorker: false,
            foldStyle: "markbegin",
            displayIndentGuides: true,
            enableAutoIndent: true,
            fixedWidthGutter: true,
            showLineNumbers: true,
        }}
        value={props.text} />
})
