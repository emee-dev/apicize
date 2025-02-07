import * as React from 'react'
import Box from '@mui/material/Box'
import { Button, FormControl, Grid2, IconButton, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'
import { EditableNameValuePair } from '../../../models/workspace/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';

import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-json"
import "ace-builds/src-noconflict/mode-xml"
import "ace-builds/src-noconflict/theme-gruvbox"
import "ace-builds/src-noconflict/theme-chrome"
import "ace-builds/src-noconflict/ext-language_tools"
import "ace-builds/src-noconflict/ext-searchbox"
import beautify from "js-beautify";
import { BodyType, BodyTypes } from '@apicize/lib-typescript'
import { EditableEntityType } from '../../../models/workspace/editable-entity-type'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useClipboard } from '../../../contexts/clipboard.context'
import { useFileOperations } from '../../../contexts/file-operations.context'
import { toJS } from 'mobx'
import { useWorkspace } from '../../../contexts/workspace.context'
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import { useApicizeSettings } from '../../../contexts/apicize-settings.context'

export const RequestBodyEditor = observer(() => {
  const workspace = useWorkspace()
  const apicizeSettings = useApicizeSettings()
  const clipboard = useClipboard()
  const fileOps = useFileOperations()
  const feedback = useFeedback()

  const editorRef = React.createRef<AceEditor>()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  workspace.nextHelpTopic = 'requests/body'
  const request = workspace.active as EditableRequest

  const headerDoesNotMatchType = (bodyType: BodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    let mimeType = getBodyTypeMimeType(bodyType)
    const contentTypeHeader = request.headers?.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      needsContextHeaderUpdate = contentTypeHeader.value !== mimeType
    } else {
      needsContextHeaderUpdate = mimeType.length !== 0
    }
    return needsContextHeaderUpdate
  }

  const getBodyTypeMimeType = (bodyType: BodyType | undefined | null) => {
    switch (bodyType) {
      case BodyType.None:
        return ''
      case BodyType.JSON:
        return 'application/json'
      case BodyType.XML:
        return 'application/xml'
      case BodyType.Text:
        return 'text/plain'
      case BodyType.Form:
        return 'application/x-www-form-urlencoded'
      default:
        return 'application/octet-stream'
    }
  }

  const [allowUpdateHeader, setAllowUpdateHeader] = React.useState<boolean>(headerDoesNotMatchType(request.body.type))
  const [beautifyBodyType, setBeautifyBodyType] = React.useState((request.body.type === BodyType.JSON || request.body.type === BodyType.XML)
    ? request.body.type : BodyType.None)

  const updateBodyType = (val: BodyType | string) => {
    const v = toJS(val)
    const newBodyType = (v == "" ? undefined : v as unknown as BodyType) ?? BodyType.Text
    workspace.setRequestBodyType(newBodyType)
    setAllowUpdateHeader(headerDoesNotMatchType(newBodyType))
    setBeautifyBodyType((newBodyType === BodyType.JSON || newBodyType === BodyType.XML) ? newBodyType : BodyType.None)
  }

  function performBeautify() {
    if (!editorRef.current) return
    let text = editorRef.current.editor.session.getValue()
    switch (beautifyBodyType) {
      case BodyType.JSON:
        text = beautify.js_beautify(text, {})
        break
      case BodyType.XML:
        text = beautify.html_beautify(text, {})
        break
      default:
        return
    }

    editorRef.current.editor.session.setValue(text)
  }

  const updateBodyAsText = (data: string | undefined) => {
    workspace.setRequestBodyData(data ?? '')
  }

  const updateBodyAsFormData = (data: EditableNameValuePair[] | undefined) => {
    workspace.setRequestBodyData(data ?? [])
  }

  const updateTypeHeader = () => {
    const mimeType = getBodyTypeMimeType(request.body.type)
    let newHeaders = request.headers ? toJS(request.headers) : []
    const contentTypeHeader = newHeaders.find(h => h.name === 'Content-Type')
    if (contentTypeHeader) {
      if (mimeType.length === 0) {
        newHeaders = newHeaders.filter(h => h.name !== 'Content-Type')
      } else {
        contentTypeHeader.value = mimeType

      }
    } else {
      if (mimeType.length > 0) {
        newHeaders.push({
          id: GenerateIdentifier(),
          name: 'Content-Type',
          value: mimeType
        })
      }
    }
    setAllowUpdateHeader(false)
    workspace.setRequestHeaders(newHeaders)
  }

  const bodyTypeMenuItems = () => {
    return BodyTypes.map(bodyType => (
      <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
    ))
  }

  const pasteImageFromClipboard = async () => {
    try {
      const data = await clipboard.getClipboardImage()
      workspace.setRequestBody({ type: BodyType.Raw, data })
      feedback.toast('Image pasted from clipboard', ToastSeverity.Success)
    } catch (e) {
      feedback.toast(`Unable to access clipboard image - ${e}`, ToastSeverity.Error)
    }
  }

  const openFile = async () => {
    try {
      const data = await fileOps.openFile()
      if (!data) return
      workspace.setRequestBody({ type: BodyType.Raw, data })
    } catch (e) {
      feedback.toast(`Unable to open file - ${e}`, ToastSeverity.Error)
    }
  }

  let mode

  switch (request.body.type) {
    case BodyType.JSON:
      mode = 'json'
      break
    case BodyType.XML:
      mode = 'xml'
      break
  }

  return (
    <Grid2 container direction='column' spacing={3} position='relative' width='100%' height='100%'>
      <Grid2 direction='row' display='flex' justifyContent='space-between'>
        <FormControl>
          <InputLabel id='request-body-type-label-id'>Body Content Type</InputLabel>
          <Select
            labelId='request-method-label-id'
            id="request-method"
            value={request.body.type}
            label="Body Content Type"
            sx={{
              width: "10em"
            }}
            size='small'
            onChange={e => updateBodyType(e.target.value)}
            aria-labelledby='request-body-type-label-id'
          >
            {bodyTypeMenuItems()}
          </Select>
        </FormControl>
        <Grid2 container direction='row' spacing={2}>
          <Button variant='outlined' size='small' disabled={beautifyBodyType === BodyType.None} onClick={performBeautify}>Beautify</Button>
          <Button variant='outlined' size='small' disabled={!allowUpdateHeader} onClick={updateTypeHeader}>Update Content-Type Header</Button>
        </Grid2>
      </Grid2>
      {request.body.type == BodyType.None
        ? <></>
        : request.body.type == BodyType.Form
          ? <NameValueEditor
            title='body form data'
            values={request.body.data as EditableNameValuePair[]}
            nameHeader='Name'
            valueHeader='Value'
            onUpdate={updateBodyAsFormData} />
          : request.body.type == BodyType.Raw
            ? <Stack
              direction='row'
              sx={{
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #444!important',
                width: 'fit-content',
              }}
            >
              <IconButton aria-label='load body from file' title='Load Body from File' onClick={() => openFile()} sx={{ marginRight: '4px' }}>
                <FileOpenIcon />
              </IconButton>
              <IconButton aria-label='copy body from clipboard' title='Paste Body from Clipboard' disabled={!clipboard.hasImage}
                onClick={() => pasteImageFromClipboard()} sx={{ marginRight: '4px' }}>
                <ContentPasteGoIcon />
              </IconButton>
              <Box padding='10px'>{request.body.data ? request.body.data.length.toLocaleString() + ' Bytes' : '(None)'}</Box>
            </Stack>
            :
            <Grid2 flexGrow={1}>
              <AceEditor
                ref={editorRef}
                mode={mode}
                name='request-body-editor'
                theme={apicizeSettings.colorScheme === 'dark' ? 'gruvbox' : 'chrome'}
                fontSize={`${apicizeSettings.fontSize}pt`}
                lineHeight='1.1em'
                width='100%'
                height='100%'
                showGutter={true}
                showPrintMargin={false}
                tabSize={3}
                setOptions={{
                  useWorker: false,
                  foldStyle: "markbegin",
                  displayIndentGuides: true,
                  enableAutoIndent: true,
                  fixedWidthGutter: true,
                  showLineNumbers: true,
                }}
                onChange={updateBodyAsText}
                value={request.body.data as string}
              />
            </Grid2>
      }
    </Grid2>
  )
})
