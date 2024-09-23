import { Typography } from "@mui/material";
import { Grammar, highlight, languages } from 'prismjs'

import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-json"
import "ace-builds/src-noconflict/mode-xml"
import "ace-builds/src-noconflict/mode-html"
import "ace-builds/src-noconflict/mode-css"
import "ace-builds/src-noconflict/mode-text"
import "ace-builds/src-noconflict/theme-monokai"
import "ace-builds/src-noconflict/ext-language_tools"
import { observer } from "mobx-react-lite";

export const MAX_TEXT_RENDER_LENGTH = 64 * 1024 * 1024

const FlexCodeViewer = (props: { text: string, grammar?: Grammar, language?: string }) => (
    <pre style={{
        overflow: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        paddingRight: '12px',
        marginTop: 0,
        fontSize: '10pt',
        whiteSpace: 'pre-wrap',
        lineBreak: 'anywhere'
    }}>
        {(props.grammar && props.language)
            ? (<code dangerouslySetInnerHTML={{
                __html: highlight(props.text, props.grammar, props.language)
            }} />)
            : (<code>{props.text}</code>)}
    </pre>)

export const TextViewer = observer((props: { text?: string, extension?: string }) => {
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
        theme='monokai'
        fontSize='1rem'
        lineHeight='1rem'
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


    // switch (props.extension) {
    //     case 'html':
    //         return (<FlexCodeViewer text={render} grammar={languages.html} language='html' />)
    //     case 'css':
    //         return (<FlexCodeViewer text={render} grammar={languages.css} language='css' />)
    //     case 'js':
    //         return (<FlexCodeViewer text={render}  grammar={languages.javascript} language='javascript' />)
    //     case 'json':
    //         return (<FlexCodeViewer text={render}  grammar={languages.json} language='json' />)
    //     default:
    //         return (<FlexCodeViewer text={render} />)
})
