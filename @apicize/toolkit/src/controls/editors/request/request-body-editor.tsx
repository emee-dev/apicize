import Box from '@mui/material/Box'
import { Button, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack } from '@mui/material'
import { EditableNameValuePair } from '../../../models/workspace/editable-name-value-pair'
import { NameValueEditor } from '../name-value-editor'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { BodyType, BodyTypes, NameValuePair } from '@apicize/lib-typescript'
import { observer } from 'mobx-react-lite'
import { useClipboard } from '../../../contexts/clipboard.context'
import { useFileOperations } from '../../../contexts/file-operations.context'
import { toJS } from 'mobx'
import { useWorkspace } from '../../../contexts/workspace.context'
import { ToastSeverity, useFeedback } from '../../../contexts/feedback.context'
import { RichEditor, RichEditorCommands } from '../rich-editor'
import { useEffect, useRef, useState } from 'react'
import { EditorMode } from '../../../models/editor-mode'
import { DroppedFile, useFileDragDrop } from '../../../contexts/file-dragdrop.context'
import { EditableRequestBody } from '../../../models/workspace/editable-request-body'
import { RequestEditSessionType } from '../editor-types'
import { EditableRequestHeaders } from '../../../models/workspace/editable-request-headers'
import { GenerateIdentifier } from '../../../services/random-identifier-generator'

export const RequestBodyEditor = observer((props: { body: EditableRequestBody | null, headers: EditableRequestHeaders | null }) => {
  const workspace = useWorkspace()
  const clipboard = useClipboard()
  const fileOps = useFileOperations()
  const feedback = useFeedback()
  const fileDragDrop = useFileDragDrop()

  workspace.nextHelpTopic = 'requests/body'

  const refContainer = useRef<HTMLElement>(null)
  const refCommands = useRef<RichEditorCommands>(null)

  const [isDragging, setIsDragging] = useState(false)

  const bodyInfo = props.body
  const headerInfo = props.headers

  useEffect(() => {
    if (refContainer.current) {
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
          if (bodyInfo) {
            switch (file.type) {
              case 'binary':
                bodyInfo.setBody({
                  type: BodyType.Raw,
                  data: file.data
                })
                break
              case 'text':
                switch (file.extension) {
                  case 'json':
                    bodyInfo.setBody({
                      type: BodyType.JSON,
                      data: file.data
                    })
                    break
                  case 'xml':
                    bodyInfo.setBody({
                      type: BodyType.XML,
                      data: file.data
                    })
                    break
                  default:
                    bodyInfo.setBody({
                      type: BodyType.Text,
                      data: file.data
                    })
                }
                refCommands.current?.setText(file.data)
                break
            }
          }
        }
      })
      return (() => {
        unregisterDragDrop()
      })
    }
  }, [])

  if (!bodyInfo) {
    const workspace = useWorkspace()
    workspace.activeSelection?.initializeBody()
    return null
  }

  if (!headerInfo) {
    const workspace = useWorkspace()
    workspace.activeSelection?.initializeHeaders()
    return null
  }

  const id = bodyInfo.id

  const headerDoesNotMatchType = (bodyType: BodyType | undefined | null) => {
    let needsContextHeaderUpdate = true
    let mimeType = getBodyTypeMimeType(bodyType)
    const contentTypeHeader = headerInfo?.headers?.find(h => h.name === 'Content-Type')
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

  const allowUpdateHeader = headerDoesNotMatchType(bodyInfo?.type ?? BodyType.None)


  const updateBodyType = (val: BodyType | string) => {
    const v = toJS(val)
    const newBodyType = (v == "" ? undefined : v as unknown as BodyType) ?? BodyType.Text
    bodyInfo.setBodyType(newBodyType)
    // setAllowUpdateHeader(headerDoesNotMatchType(newBodyType))
  }

  function performBeautify() {
    if (refCommands.current) {
      refCommands.current.beautify()
      bodyInfo?.onUpdate()
    }
  }

  const updateBodyAsText = (data: string | undefined) => {
    const value = data ?? ''
    bodyInfo.setBodyData(value)
    workspace.updateEditorSessionText(id, RequestEditSessionType.Body, value)
  }

  const updateBodyAsFormData = (data: EditableNameValuePair[] | undefined) => {
    bodyInfo.setBodyData(data ?? [])
  }

  const updateTypeHeader = () => {
    const mimeType = getBodyTypeMimeType(bodyInfo.type)
    let newHeaders = headerInfo.headers.map(h => ({
      id: h.id,
      isNew: h.isNew,
      disabled: h.disabled,
      name: h.name,
      value: h.value
    }))
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
          isNew: true,
          disabled: undefined,
          name: 'Content-Type',
          value: mimeType
        })
      }
    }
    // setAllowUpdateHeader(false)
    headerInfo.setHeaders(newHeaders)
  }

  const bodyTypeMenuItems = () => {
    return BodyTypes.map(bodyType => (
      <MenuItem key={bodyType} value={bodyType}>{bodyType}</MenuItem>
    ))
  }

  const pasteImageFromClipboard = async () => {
    try {
      const data = await clipboard.getClipboardImage()
      bodyInfo.setBody({ type: BodyType.Raw, data })
      feedback.toast('Image pasted from clipboard', ToastSeverity.Success)
    } catch (e) {
      feedback.toast(`Unable to access clipboard image - ${e}`, ToastSeverity.Error)
    }
  }

  const openFile = async () => {
    try {
      const data = await fileOps.openFile()
      if (!data) return
      bodyInfo.setBody({ type: BodyType.Raw, data })
    } catch (e) {
      feedback.toast(`Unable to open file - ${e}`, ToastSeverity.Error)
    }
  }

  let allowCopy: boolean
  switch (bodyInfo.type) {
    case BodyType.Form:
      allowCopy = (bodyInfo.data?.length ?? 0) > 0
      break
    case BodyType.JSON:
      allowCopy = (bodyInfo.data?.length ?? 0) > 0
      break
    case BodyType.XML:
      allowCopy = (bodyInfo.data?.length ?? 0) > 0
      break
    case BodyType.Text:
      allowCopy = (bodyInfo.data?.length ?? 0) > 0
      break
    default:
      allowCopy = false
  }

  const copyToClipboard = async () => {
    let p: Promise<void>
    switch (bodyInfo.type) {
      case BodyType.Form:
        p = clipboard.writeTextToClipboard(
          (bodyInfo.data ? [...(bodyInfo.data as NameValuePair[]).values()].map(pair => `${pair.name}=${pair.value}`).join('\n') : '')
        )
        break
      case BodyType.JSON:
      case BodyType.XML:
      case BodyType.Text:
        p = clipboard.writeTextToClipboard(bodyInfo.data as string)
        break
      default:
        return
    }
    p
      .then(() => feedback.toast('Body copied to clipboard', ToastSeverity.Info))
      .catch(e => feedback.toastError(e))

  }

  const editorMode = getBodyTypeEditorMode(bodyInfo.type)

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
        <Grid container direction='row' display='flex' justifyContent='space-between' maxWidth='65em'>
          <Stack direction='row'>
            <FormControl>
              <InputLabel id='request-body-type-label-id'>Body Content Type</InputLabel>
              <Select
                labelId='request-method-label-id'
                id="request-method"
                value={bodyInfo.type}
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
          <Grid container direction='row' spacing={2}>
            <Button variant='outlined' size='small' disabled={![BodyType.JSON, BodyType.XML].includes(bodyInfo.type)} onClick={performBeautify}>Beautify</Button>
            <Button variant='outlined' size='small' disabled={!allowUpdateHeader} onClick={updateTypeHeader}>Update Content-Type Header</Button>
          </Grid>
        </Grid>
        {bodyInfo.type == BodyType.None
          ? <></>
          : bodyInfo.type == BodyType.Form
            ? <NameValueEditor
              title='body form data'
              values={bodyInfo.data as EditableNameValuePair[]}
              nameHeader='Name'
              valueHeader='Value'
              onUpdate={updateBodyAsFormData} />
            : bodyInfo.type == BodyType.Raw
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
                <Box padding='10px'>{bodyInfo.data ? bodyInfo.data.length.toLocaleString() + ' Bytes' : '(None)'}</Box>
              </Stack>
              :
              <RichEditor
                id={id}
                sx={{ width: '100%', height: '100%' }}
                ref={refCommands}
                type={RequestEditSessionType.Body}
                value={bodyInfo.data as string}
                mode={editorMode}
                onUpdateValue={updateBodyAsText}
              />
        }
      </Stack>
    </Box>
  )
})
