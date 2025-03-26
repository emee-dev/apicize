import Box from '@mui/material/Box'
import { Button, FormControl, Grid2, IconButton, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'
import { EditableNameValuePair } from '../../../models/workspace/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { BodyType, BodyTypes } from '@apicize/lib-typescript'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useClipboard } from '../../../contexts/clipboard.context'
import { useFileOperations } from '../../../contexts/file-operations.context'
import { toJS } from 'mobx'
import { useWorkspace } from '../../../contexts/workspace.context'
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import { RichEditor, RichEditorCommands } from '../rich-editor'
import { useEffect, useRef, useState } from 'react'
import { EditorMode } from '../../../models/editor-mode'
import { RequestEditSessionType, useWorkspaceSession } from '../../../contexts/workspace-session.context'
import { DroppedFile, useFileDragDrop } from '../../../contexts/file-dragdrop.context'

export const RequestBodyEditor = observer((props: { request: EditableRequest }) => {
  const workspace = useWorkspace()
  const session = useWorkspaceSession()
  const clipboard = useClipboard()
  const fileOps = useFileOperations()
  const feedback = useFeedback()
  const fileDragDrop = useFileDragDrop()

  const refContainer = useRef<HTMLElement>(null)
  const refCommands = useRef<RichEditorCommands>(null)

  const [isDragging, setIsDragging] = useState(false)

  session.nextHelpTopic = 'requests/body'

  const headerDoesNotMatchType = (bodyType: BodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    let mimeType = getBodyTypeMimeType(bodyType)
    const contentTypeHeader = props.request.headers?.find(h => h.name === 'Content-Type')
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

  const getBodyTypeEditorMode = (bodyType: BodyType | undefined | null) => {
    switch (bodyType) {
      case BodyType.JSON:
        return EditorMode.json
      case BodyType.XML:
        return EditorMode.xml
      case BodyType.Text:
        return EditorMode.txt
      default:
        return undefined
    }
  }

  const [allowUpdateHeader, setAllowUpdateHeader] = useState<boolean>(headerDoesNotMatchType(props.request.body.type))
  const [editorMode, setEditorMode] = useState(getBodyTypeEditorMode(props.request.body.type))

  const updateBodyType = (val: BodyType | string) => {
    const v = toJS(val)
    const newBodyType = (v == "" ? undefined : v as unknown as BodyType) ?? BodyType.Text
    props.request.setBodyType(newBodyType)
    setEditorMode(getBodyTypeEditorMode(newBodyType))
    setAllowUpdateHeader(headerDoesNotMatchType(newBodyType))
  }

  function performBeautify() {
    if (refCommands.current) {
      refCommands.current.beautify()
    }
  }

  const updateBodyAsText = (data: string | undefined) => {
    const value = data ?? ''
    props.request.setBodyData(value)
    workspace.updateEditorSessionText(props.request.id, RequestEditSessionType.Body, value, session.id)
  }

  const updateBodyAsFormData = (data: EditableNameValuePair[] | undefined) => {
    props.request.setBodyData(data ?? [])
  }

  const updateTypeHeader = () => {
    const mimeType = getBodyTypeMimeType(props.request.body.type)
    let newHeaders = props.request.headers ? toJS(props.request.headers) : []
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
    props.request.setHeaders(newHeaders)
  }

  const bodyTypeMenuItems = () => {
    return BodyTypes.map(bodyType => (
      <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
    ))
  }

  const pasteImageFromClipboard = async () => {
    try {
      const data = await clipboard.getClipboardImage()
      props.request.setBody({ type: BodyType.Raw, data })
      feedback.toast('Image pasted from clipboard', ToastSeverity.Success)
    } catch (e) {
      feedback.toast(`Unable to access clipboard image - ${e}`, ToastSeverity.Error)
    }
  }

  const openFile = async () => {
    try {
      const data = await fileOps.openFile()
      if (!data) return
      props.request.setBody({ type: BodyType.Raw, data })
    } catch (e) {
      feedback.toast(`Unable to open file - ${e}`, ToastSeverity.Error)
    }
  }

  useEffect(() => {
    const unregisterDragDrop = fileDragDrop.register(refContainer, {
      onEnter: (_x, _y, _paths) => {
        setIsDragging(true)
      },
      onOver: (_x, _y) => {
        setIsDragging(true)
      },
      onLeave: () => {
        setIsDragging(false)
      },
      onDrop: (file: DroppedFile) => {
        setIsDragging(false)
        switch (file.type) {
          case 'binary':
            props.request.setBody({
              type: BodyType.Raw,
              data: file.data
            })
            break
          case 'text':
            switch (file.extension) {
              case 'json':
                props.request.setBody({
                  type: BodyType.JSON,
                  data: file.data
                })
                break
              case 'xml':
                props.request.setBody({
                  type: BodyType.XML,
                  data: file.data
                })
                break
              default:
                props.request.setBody({
                  type: BodyType.Text,
                  data: file.data
                })
            }
            refCommands.current?.setText(file.data)
            break
        }
      }
    })
    return (() => {
      unregisterDragDrop()
    })
  }, [])

  let mode
  let allowCopy: boolean
  switch (props.request.body.type) {
    case BodyType.Form:
      allowCopy = props.request.body.data.length > 0
      break
    case BodyType.JSON:
      mode = 'json'
      allowCopy = props.request.body.data.length > 0
      break
    case BodyType.XML:
      mode = 'xml'
      allowCopy = props.request.body.data.length > 0
      break
    case BodyType.Text:
      allowCopy = props.request.body.data.length > 0
      break
    default:
      allowCopy = false
  }

  const copyToClipboard = async () => {
    switch (props.request.body.type) {
      case BodyType.Form:
        await clipboard.writeTextToClipboard(
          [...props.request.body.data.values()].map(pair => `${pair.name}=${pair.value}`).join('\n'))
        break
      case BodyType.JSON:
      case BodyType.XML:
      case BodyType.Text:
        await clipboard.writeTextToClipboard(props.request.body.data)
        break
    }
  }

  return (
    <Box id='request-body-container' ref={refContainer} position='relative' width='100%' height='100%' paddingTop='0.7em'>
      <Box top={0}
        left={0}
        width='100%'
        height='100%'
        position='absolute'
        display={isDragging ? 'block' : 'none'}
        className="MuiBackdrop-root MuiModal-backdrop"
        sx={{ zIndex: 99999, opacity: 0.5, transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms", backgroundColor: "#008000" }} />

      <Stack direction='column' spacing={3} position='relative' width='100%' height='100%'>
        <Grid2 container direction='row' display='flex' justifyContent='space-between' maxWidth='65em'>
          <Stack direction='row'>
            <FormControl>
              <InputLabel id='request-body-type-label-id'>Body Content Type</InputLabel>
              <Select
                labelId='request-method-label-id'
                id="request-method"
                value={props.request.body.type}
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
            {
              allowCopy
                ? <IconButton
                  aria-label="copy data to clipboard"
                  title="Copy Data to Clipboard"
                  color='primary'
                  sx={{ marginLeft: '16px' }}
                  onClick={_ => copyToClipboard()}>
                  <ContentCopyIcon />
                </IconButton>
                : <></>
            }
          </Stack>
          <Grid2 container direction='row' spacing={2}>
            <Button variant='outlined' size='small' disabled={![BodyType.JSON, BodyType.XML].includes(props.request.body.type)} onClick={performBeautify}>Beautify</Button>
            <Button variant='outlined' size='small' disabled={!allowUpdateHeader} onClick={updateTypeHeader}>Update Content-Type Header</Button>
          </Grid2>
        </Grid2>
        {props.request.body.type == BodyType.None
          ? <></>
          : props.request.body.type == BodyType.Form
            ? <NameValueEditor
              title='body form data'
              values={props.request.body.data as EditableNameValuePair[]}
              nameHeader='Name'
              valueHeader='Value'
              onUpdate={updateBodyAsFormData} />
            : props.request.body.type == BodyType.Raw
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
                  <FileOpenIcon color='primary' />
                </IconButton>
                <IconButton aria-label='copy body from clipboard' title='Paste Body from Clipboard' disabled={!clipboard.hasImage}
                  onClick={() => pasteImageFromClipboard()} sx={{ marginRight: '4px' }}>
                  <ContentPasteGoIcon color='primary' />
                </IconButton>
                <Box padding='10px'>{props.request.body.data ? props.request.body.data.length.toLocaleString() + ' Bytes' : '(None)'}</Box>
              </Stack>
              :
              <RichEditor
                id={props.request.id}
                sx={{ width: '100%', height: '100%' }}
                ref={refCommands}
                type={RequestEditSessionType.Body}
                value={props.request.body.data}
                mode={editorMode}
                onUpdateValue={updateBodyAsText}
              />
        }
      </Stack>
    </Box>
  )
})
