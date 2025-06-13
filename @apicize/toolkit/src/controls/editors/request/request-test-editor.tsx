import { EditableRequest } from "../../../models/workspace/editable-request";
import { observer } from "mobx-react-lite";
import { createRef, useEffect, useRef, useState } from "react";
import { EditorMode } from "../../../models/editor-mode";
import { useWorkspace } from "../../../contexts/workspace.context";
import { Box, Button, IconButton, Stack } from "@mui/material";
import { DroppedFile, useFileDragDrop } from "../../../contexts/file-dragdrop.context";
import { RequestEditSessionType } from "../editor-types";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useClipboard } from "../../../contexts/clipboard.context";
import { ToastSeverity, useFeedback } from "../../../contexts/feedback.context";
import MonacoEditor, { monaco } from 'react-monaco-editor';

// import CHAI_RAW from '../../../../typings/chai?raw'
import ES5_RAW from '../../../../../../node_modules/typescript/lib/lib.es5.d.ts?raw'
import { editor } from "monaco-editor";
import { useApicize } from "../../../contexts/apicize.context";
import { runInAction } from "mobx";

const BDD_RAW = `
/**
 * Describes something under test (code, entity, etc.)
 * @param name Name of what is being tested
 * @param fn Function that includes child "describe" and "it" functions
 */
declare function describe(name: string, fn: () => void): void


/**
 * Tests an expected behavior
 * @param name Name of the behavior being tested
 * @param fn Function that throws an Error (or fails assertion) upon failure
 */
declare function it(name: string, fn: () => void): void
`

export const RequestTestEditor = observer((props: { request: EditableRequest }) => {
  const workspace = useWorkspace()
  const clipboard = useClipboard()
  const settings = useApicize()
  const feedback = useFeedback()
  const fileDragDrop = useFileDragDrop()

  const refContainer = createRef<HTMLElement>()
  const [isDragging, setIsDragging] = useState(false)
  const [isDragingValid, setIsDraggingValid] = useState(false)

  const initalialized = useRef(false)
  const editor = useRef<editor.IStandaloneCodeEditor | null>(null)

  const [model, setModel] = useState<editor.ITextModel | null>(null)

  workspace.nextHelpTopic = 'requests/test'

  useEffect(() => {
    if (refContainer.current) {
      const id = refContainer.current.id
      const unregisterDragDrop = fileDragDrop.register(refContainer, {
        onEnter: (_x, _y, extensions) => {
          setIsDraggingValid(extensions.includes('js'))
        },
        onOver: (_x, _y, extensions) => {
          setIsDragging(true)
          let isJs = extensions.includes('js')
          setIsDraggingValid(isJs)
        },
        onLeave: () => {
          setIsDragging(false)
        },
        onDrop: (file: DroppedFile) => {
          setIsDragging(false)
          if (!isDragingValid) return
          switch (file.type) {
            case 'text':
              runInAction(() => {
                props.request.test = file.data.toString()
              })
              break
          }
        }
      })
      return (() => {
        unregisterDragDrop()
      })
    }
  }, [refContainer])

  const copyToClipboard = () => {
    clipboard.writeTextToClipboard(props.request.test)
      .then(() => feedback.toast('Tests copied to clipboard', ToastSeverity.Info))
      .catch(e => feedback.toastError(e))
  }

  function performBeautify() {
    if (editor.current) {
      try {
        const action = editor.current.getAction('editor.action.formatDocument')
        if (!action) throw new Error('Format action not found')
        action.run()
      } catch (e) {
        feedback.toastError(e)
      }
    }
  }


  if (!model) {
    workspace.getRequestEditModel(props.request.id, RequestEditSessionType.Test, EditorMode.js)
      .then(m => setModel(m))
      .catch(e => feedback.toastError(e))
    return null
  }

  return <Box id='request-test-container' position='relative' width='100%' height='100%' paddingTop='0.7em'>
    <Stack direction='column' spacing={3} position='relative' width='100%' height='100%'>
      <Stack direction='row' justifyContent='center' display='flex'>
        <IconButton
          aria-label="copy tests to clipboard"
          title="Copy Tests to Clipboard"
          color='primary'
          sx={{ marginLeft: '16px' }}
          onClick={_ => copyToClipboard()}>
          <ContentCopyIcon />
        </IconButton>
        <Box flexGrow={1} minWidth={0} />
        <Button variant='outlined' size='small' onClick={performBeautify}>Beautify Test Code</Button>
      </Stack>
      <Box top={0}
        left={0}
        width='100%'
        height='100%'
        position='absolute'
        display={isDragging ? 'block' : 'none'}
        className="MuiBackdrop-root MuiModal-backdrop"
        sx={{ zIndex: 99999, opacity: 0.5, transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms", backgroundColor: isDragingValid ? "#008000" : "#800000" }} />

      <Box id='req-test-editor' ref={refContainer} position='relative' width='100%' height='100%'>
        <MonacoEditor
          language='javascript'
          theme={settings.colorScheme === "dark" ? 'vs-dark' : 'vs-light'}
          value={props.request.test}
          onChange={(text: string) => {
            props.request.setTest(text)
          }}
          options={{
            minimap: { enabled: false },
            model,
            detectIndentation: false,
            tabSize: settings.tabSize,
            folding: true,
            formatOnType: true,
            formatOnPaste: true,
            fontSize: settings.fontSize * 1.2,
          }}
          editorDidMount={(me) => {
            editor.current = me

            if (!initalialized.current) {
              monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                noLib: true,
                allowNonTsExtensions: true,
                noEmit: true,
              });

              monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSuggestionDiagnostics: true,
                noSyntaxValidation: false,
              });


              const es5Uri = monaco.Uri.parse('file://node_modules/typescript/lib/lib.es5.d.ts')
              if (!monaco.editor.getModel(es5Uri)) {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(ES5_RAW)
                monaco.languages.typescript.javascriptDefaults.addExtraLib(ES5_RAW)
                monaco.editor.createModel(ES5_RAW, 'typescript', es5Uri)
              }

              const bddUri = monaco.Uri.parse('ts:filename/bdd.d.ts')
              if (!monaco.editor.getModel(bddUri)) {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(BDD_RAW)
                monaco.languages.typescript.javascriptDefaults.addExtraLib(BDD_RAW)
                monaco.editor.createModel(BDD_RAW, 'typescript', bddUri)
              }

              // const chaiUri = monaco.Uri.parse('file://node_modules/@types/chai/index.d.ts')
              // if (!monaco.editor.getModel(chaiUri)) {
              //   monaco.languages.typescript.typescriptDefaults.addExtraLib(CHAI_RAW)
              //   monaco.languages.typescript.javascriptDefaults.addExtraLib(CHAI_RAW)
              //   monaco.editor.createModel(CHAI_RAW, 'typescript', chaiUri)
              // }

              initalialized.current = true
            }
          }
          }
        />
      </Box>
    </Stack>
  </Box>
})