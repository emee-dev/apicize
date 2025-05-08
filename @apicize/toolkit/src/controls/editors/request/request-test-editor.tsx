import { EditableRequest } from "../../../models/workspace/editable-request";
import { observer } from "mobx-react-lite";
import { RichEditor, RichEditorCommands } from '../rich-editor'
import { useEffect, useRef, useState } from "react";
import { EditorMode } from "../../../models/editor-mode";
import { useWorkspace } from "../../../contexts/workspace.context";
import { Box } from "@mui/material";
import { DroppedFile, useFileDragDrop } from "../../../contexts/file-dragdrop.context";
import { RequestEditSessionType } from "../editor-types";

export const RequestTestEditor = observer((props: { request: EditableRequest }) => {
  const workspace = useWorkspace()
  const fileDragDrop = useFileDragDrop()

  const refCommands = useRef<RichEditorCommands>(null)
  const refContainer = useRef<HTMLElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDragingValid, setIsDraggingValid] = useState(false)

  workspace.nextHelpTopic = 'requests/test'

  useEffect(() => {
    const unregisterDragDrop = fileDragDrop.register(refContainer, {
      onEnter: (_x, _y, extensions) => {
        setIsDragging(true)
        setIsDraggingValid(extensions.includes('js'))
      },
      onOver: (_x, _y, extensions) => {
        setIsDragging(true)
        setIsDraggingValid(extensions.includes('js'))
      },
      onLeave: () => {
        setIsDragging(false)
      },
      onDrop: (file: DroppedFile) => {
        setIsDragging(false)
        if (!isDragingValid) return
        switch (file.type) {
          // case 'binary':
          //   props.request.setBody({
          //     type: BodyType.Raw,
          //     data: file.data
          //   })
          //   break
          case 'text':
            // switch (file.extension) {
            //   case 'json':
            //     props.request.setBody({
            //       type: BodyType.JSON,
            //       data: file.data
            //     })
            //     break
            //   case 'xml':
            //     props.request.setBody({
            //       type: BodyType.XML,
            //       data: file.data
            //     })
            //     break
            //   default:
            //     props.request.setBody({
            //       type: BodyType.Text,
            //       data: file.data
            //     })
            // }
            refCommands.current?.setText(file.data)
            break
        }
      }
    })
    return (() => {
      unregisterDragDrop()
    })
  }, [isDragging, isDragingValid])


  return <Box id='request-test-container' ref={refContainer} position='relative' width='100%' height='100%' paddingTop='0.7em'>
    <Box top={0}
      left={0}
      width='100%'
      height='100%'
      position='absolute'
      display={isDragging ? 'block' : 'none'}
      className="MuiBackdrop-root MuiModal-backdrop"
      sx={{ zIndex: 99999, opacity: 0.5, transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms", backgroundColor: isDragingValid ? "#008000" : "#800000" }} />

    <RichEditor
      sx={{ width: '100%', height: '100%' }}
      id={props.request.id}
      type={RequestEditSessionType.Test}
      value={props.request.test}
      ref={refCommands}
      mode={EditorMode.js}
      onUpdateValue={(text: string) => {
        workspace.updateEditorSessionText(props.request.id, RequestEditSessionType.Test, text)
        props.request.setTest(text)
      }}
    />
  </Box>
})