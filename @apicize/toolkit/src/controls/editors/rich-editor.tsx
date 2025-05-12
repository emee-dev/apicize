import 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

import { Box } from '@mui/material'
import { SxProps } from '@mui/system'
import ace, { Editor } from 'ace-code'
import { Mode as JavaScriptMode } from 'ace-code/src/mode/javascript'
// import { Mode as TypeScriptMode } from 'ace-code/src/mode/typescript'
import { Mode as JsonMode } from 'ace-code/src/mode/json'
import { Mode as XmlMode } from 'ace-code/src/mode/xml'
import { Mode as HtmlMode } from 'ace-code/src/mode/html'
import { Mode as CssMode } from 'ace-code/src/mode/css'
import { Mode as TextMode } from 'ace-code/src/mode/text'

import { LanguageProvider } from "ace-linters";
import 'ace-code/src/ext/language_tools'

import { createRef, forwardRef, Ref, RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'
import theme from 'ace-code/src/theme/gruvbox'
import { EditorMode } from '../../models/editor-mode'
import { css_beautify, html_beautify, js_beautify } from 'js-beautify'
import { useApicize } from '../../contexts/apicize.context'
import { RequestEditSessionType } from './editor-types'
import { useWorkspace } from '../../contexts/workspace.context'

const workerUrl = new URL('./webworker.js', import.meta.url)
const worker = new Worker(workerUrl)
const languageProvider = LanguageProvider.create(worker, { functionality: { semanticTokens: true } })

// We have to dynamically load search box because of webpack(?)
ace.config.dynamicModules = {
    'ace/ext/searchbox': () => import('ace-code/src/ext/searchbox')
}

const updateEditorMode = (editor: Editor, mode: EditorMode | undefined) => {
    switch (mode) {
        case EditorMode.js:
            // editor.session.setMode(new TypeScriptMode());
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
    beautify: () => void,
    setText: (text: string) => void,
}

/**
 * A rich text editor / viewer
 * @param props
 * @returns 
 */
export const RichEditor = forwardRef((props: {
    sx?: SxProps,
    // entity: EditableItem,
    id: string,
    type: RequestEditSessionType,
    value: string,
    mode?: EditorMode,
    // onGetValue: () => string,
    onUpdateValue: (value: string) => void
}, ref: Ref<RichEditorCommands>) => {
    const apicize = useApicize()
    const workspace = useWorkspace()

    const editor = useRef<Editor | null>(null)
    const [initialized, setInitialized] = useState(false)

    useImperativeHandle(ref, () => ({
        setText(text: string) {
            if (editor.current) {
                editor.current.setValue(text)
                editor.current.clearSelection()
                editor.current.renderer.scrollTo(0, 0)
            }
        },
        beautify() {
            if (editor.current) {
                const session = editor.current.session
                let value
                switch (props.mode) {
                    case EditorMode.js:
                    case EditorMode.json:
                        value = js_beautify(session.getValue(), { indent_size: 4 })
                        break
                    case EditorMode.html:
                        value = html_beautify(session.getValue(), { indent_size: 4 })
                        break
                    case EditorMode.css:
                        value = css_beautify(session.getValue(), { indent_size: 4 })
                        break
                }
                if (value) {
                    session.setValue(value)
                    props.onUpdateValue(value)
                }
            }
        }
    }))

    // On initial load, set up the editor
    useEffect(() => {
        if (initialized && editor.current) {
            if (props.value !== editor.current.getValue()) {
                editor.current.setValue(props.value)
                editor.current.clearSelection()
                editor.current.renderer.scrollTo(0, 0)
            }
        } else {
            editor.current = ace.edit('editor')
            editor.current.setTheme(theme)
            editor.current.setOption('enableBasicAutocompletion', true);
            editor.current.setOption('enableLiveAutocompletion', true);

            editor.current.setOptions({
                fontSize: `${apicize.fontSize}pt`,
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

            languageProvider.setGlobalOptions('javascript', {
                globals: {
                    magic: "readable"
                },
                errorMessagesToIgnore: [
                    /is not defined/
                ]
            })

            // languageProvider.setGlobalOptions('typescript', {
            //     extraLibs: {
            //         'foo/index.ts': {
            //             content: `
            //             var magic = "12345";
            //             declare global {
            //                magic: string
            //             }
            //             `,
            //             version: 1
            //         }
            //     }
            // })

            languageProvider.registerEditor(editor.current)

            const editSession = workspace.getRequestEditSession(props.id, props.type)
            if (editSession) {
                editor.current.setSession(editSession)
            } else {
                updateEditorMode(editor.current, props.mode)
                if (editor.current.session.getValue() !== props.value) {
                    editor.current.session.setValue(props.value)
                }
                workspace.setRequestEditSession(props.id, props.type, editor.current.getSession())
            }

            editor.current.on('change', (e) => {
                if (editor.current && editor.current.curOp && (editor.current.curOp as any).command.name) {
                    if (props.onUpdateValue) {
                        props.onUpdateValue(editor.current?.getValue() ?? '')
                    }
                }
            })

            editor.current.focus()

            setInitialized(true)
        }

    }, [props.value, props.mode])

    useEffect(() => {
        if (editor.current) {
            updateEditorMode(editor.current, props.mode)
        }
    }, [props.mode])

    return <Box id='editor' sx={props.sx} />
})
