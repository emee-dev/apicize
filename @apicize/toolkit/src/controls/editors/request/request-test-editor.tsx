import { EditableEntityType } from "../../../models/workspace/editable-entity-type";
import { EditableRequest } from "../../../models/workspace/editable-request";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "../../../contexts/workspace.context";
import { RichEditor, RichEditorCommands } from '../rich-editor'
import { useRef } from "react";
import { EditorMode } from "../../../models/editor-mode";

export const RequestTestEditor = observer(() => {
  const workspace = useWorkspace()
  const refCommands = useRef<RichEditorCommands>(null)

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  workspace.nextHelpTopic = 'requests/test'
  const request = workspace.active as EditableRequest

  {/* <Button onClick={() => { refCommands.current?.beautify() }}>Test</Button > */ }
  return <RichEditor
    sx={{ width: '100%', height: '100%' }}
    entity={request}
    ref={refCommands}
    mode={EditorMode.js}
    onGetValue={() => request.test}
    onUpdateValue={(text: string) => { workspace.setRequestTest(text) }}
  />

})