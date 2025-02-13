import 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

import { Box } from '@mui/material'
import { SxProps } from '@mui/system'
import ace, { Editor } from 'ace-code'
import { Mode as JavaScriptMode } from 'ace-code/src/mode/javascript'
import { Mode as JsonMode } from 'ace-code/src/mode/json'
import { Mode as XmlMode } from 'ace-code/src/mode/xml'
import { Mode as HtmlMode } from 'ace-code/src/mode/html'
import { Mode as CssMode } from 'ace-code/src/mode/css'
import { Mode as TextMode } from 'ace-code/src/mode/text'


import { useApicizeSettings } from '../../contexts/apicize-settings.context'
import { forwardRef, Ref, useEffect, useImperativeHandle, useRef } from 'react'
import theme from 'ace-code/src/theme/gruvbox'
import { EditableItem } from '../../models/editable'
// import { beautify } from 'ace-code/src/ext/beautify'
import { EditorMode } from '../../models/editor-mode'
import { css_beautify, html_beautify, js_beautify } from 'js-beautify'

// We have to dynamically load search box because of webpack(?)
ace.config.dynamicModules = {
    'ace/ext/searchbox': () => import('ace-code/src/ext/searchbox')
}

const updateEditorMode = (editor: Editor, mode: EditorMode | undefined) => {
    switch (mode) {
        case EditorMode.js:
            editor.session.setMode(new JavaScriptMode());
            break
        case EditorMode.json:
            editor.session.setMode(new JsonMode());
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

export interface RichEditorCommands {
    beautify: () => void
}

/**
 * A rich text editor / viewer
 * @param props
 * @returns 
 */
export const RichEditor = forwardRef((props: {
    sx?: SxProps,
    entity: EditableItem,
    mode?: EditorMode,
    onGetValue: () => string,
    onUpdateValue: (value: string) => void
}, ref: Ref<RichEditorCommands>) => {
    const apicizeSettings = useApicizeSettings()

    const editor = useRef<Editor | null>(null)

    useImperativeHandle(ref, () => ({
        beautify() {
            if (editor.current) {
                const session = editor.current.session
                switch (props.mode) {
                    case EditorMode.js:
                    case EditorMode.json:
                        session.setValue(js_beautify(session.getValue(), { indent_size: 4 }))
                        break
                    case EditorMode.html:
                        session.setValue(html_beautify(session.getValue(), { indent_size: 4 }))
                        break
                    case EditorMode.css:
                        session.setValue(css_beautify(session.getValue(), { indent_size: 4 }))
                        break
                }
            }
        }
    }))

    // On initial load, set up the editor
    useEffect(() => {
        editor.current = ace.edit('editor')
        editor.current.setTheme(theme)
        editor.current.setOptions({
            fontSize: `${apicizeSettings.fontSize}pt`,
            showGutter: true,
            showPrintMargin: false,
            tabSize: 4,
            foldStyle: 'markbegin',
            displayIndentGuides: true,
            enableAutoIndent: true,
            fixedWidthGutter: true,
            showLineNumbers: true,
            useWorker: false,
        })
        updateEditorMode(editor.current, props.mode)
        editor.current.session.on('change', () => {
            if (editor.current) {
                props.onUpdateValue(editor.current.session.getValue())
            }
        })

        editor.current.session.setValue(props.onGetValue())
    }, [props.entity])

    useEffect(() => {
        if (editor.current) {
            updateEditorMode(editor.current, props.mode)
        }
    }, [props.mode])

    return <Box id='editor' sx={props.sx} />
})
