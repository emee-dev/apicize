import 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

import { Box } from '@mui/material'
import { SxProps } from '@mui/system'
import ace, { createEditSession, Editor, EditSession } from 'ace-code'
import { Mode as JavaScriptMode } from 'ace-code/src/mode/javascript'
import { Mode as JsonMode } from 'ace-code/src/mode/json'
import { Mode as XmlMode } from 'ace-code/src/mode/xml'
import { Mode as HtmlMode } from 'ace-code/src/mode/html'
import { Mode as CssMode } from 'ace-code/src/mode/css'
import { Mode as TextMode } from 'ace-code/src/mode/text'

import { useEffect, useRef, useState } from 'react'
import theme from 'ace-code/src/theme/gruvbox'
// import { beautify } from 'ace-code/src/ext/beautify'
import { css_beautify, html_beautify, js_beautify } from 'js-beautify'
import { EditorMode } from '../../models/editor-mode'
import { useApicize } from '../../contexts/apicize.context'
import { observer } from 'mobx-react-lite'
import { ResultEditSessionType } from '../editors/editor-types'
import { useWorkspace } from '../../contexts/workspace.context'
import { SyntaxMode } from 'ace-code/src/ext/static_highlight'
import { HighlightRules } from 'ace-code/src/mode/swift_highlight_rules'
import { JsonHighlightRules } from 'ace-code/src/mode/json_highlight_rules'
import { WorkerClient } from 'ace-code/src/worker/worker_client'
import oop from 'ace-code/src/lib/oop'
import { Json5HighlightRules } from 'ace-code/src/mode/json5_highlight_rules'

// We have to dynamically load search box because of webpack(?)
ace.config.dynamicModules = {
    'ace/ext/searchbox': () => import('ace-code/src/ext/searchbox')
}

const updateEditorMode = (editor: Editor, type: ResultEditSessionType, mode: EditorMode | undefined) => {
    switch (mode) {
        case EditorMode.js:
            editor.session.setMode(new JavaScriptMode());
            break
        case EditorMode.json:
            // if (type === ResultEditSessionType.Details) {
            //     editor.session.setMode(getResultsMode())
            // } else {
            editor.session.setMode(new JsonMode());
            // }
            break
        case EditorMode.xml:
            editor.session.setMode(new XmlMode());
            break
        case EditorMode.html:
            editor.session.setMode(new HtmlMode());
            break
        case EditorMode.css:
            editor.session.setMode(new CssMode());
            break
        default:
            editor.session.setMode(new TextMode());
            break
    }
}

/**
 * A rich text editor / viewer for viewing results
 * @param props
 * @returns 
 */
export const RichViewer = observer((props: {
    sx?: SxProps,
    id: string,
    index: number,
    type: ResultEditSessionType,
    mode?: EditorMode,
    text: string,
    beautify?: boolean,
    wrap?: boolean,
}) => {
    const apicize = useApicize()
    const workspace = useWorkspace()
    const viewer = useRef<Editor | null>(null)

    const [initialized, setInitialized] = useState(false)

    let text: string
    if (props.beautify === true) {
        switch (props.mode) {
            case EditorMode.js:
            case EditorMode.json:
                text = js_beautify(props.text, { indent_size: 4 })
                break
            case EditorMode.html:
                text = html_beautify(props.text, { indent_size: 4 })
                break
            case EditorMode.css:
                text = css_beautify(props.text, { indent_size: 4 })
                break
            default:
                text = props.text
        }
    } else {
        text = props.text
    }


    // On initial load, set up the editor
    useEffect(() => {
        if (!initialized) {
            viewer.current = ace.edit('viewer')
            viewer.current.setTheme(theme)
            viewer.current.setOptions({
                fontSize: `${apicize.fontSize}pt`,
                showGutter: true,
                showPrintMargin: false,
                tabSize: 4,
                foldStyle: 'markbegin',
                displayIndentGuides: true,
                enableAutoIndent: true,
                fixedWidthGutter: true,
                showLineNumbers: true,
                wrap: props.wrap === true,
                useWorker: false,
                readOnly: true,
            })
            setInitialized(true)
        }

        const editSession = workspace.getResultEditSession(props.id, props.index, props.type)
        if (viewer.current) {
            if (editSession) {
                viewer.current.setSession(editSession)
                viewer.current.session.setValue(props.text)
            } else {
                updateEditorMode(viewer.current, props.type, props.mode)
                viewer.current.session.setValue(props.text)
                workspace.setResultEditSession(props.id, props.index, props.type, viewer.current.getSession())
            }
        }
    }, [text])
    return <Box id='viewer' sx={props.sx} />
})
