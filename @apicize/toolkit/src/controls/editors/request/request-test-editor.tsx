import 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-javascript"
import { EditableEntityType } from "../../../models/workbook/editable-entity-type";
import { EditableWorkbookRequest } from "../../../models/workbook/editable-workbook-request";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "../../../contexts/workspace.context";

export const RequestTestEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  const request = workspace.active as EditableWorkbookRequest

  return (
    <AceEditor
      mode='javascript'
      theme='monokai'
      fontSize='1rem'
      lineHeight='1rem'
      height='20em'
      width='100%'
      name='test-editor'
      showGutter={true}
      showPrintMargin={false}
      tabSize={3}
      onChange={(v) => workspace.setRequestTest(v)}
      setOptions={{
        useWorker: false,
        foldStyle: "markbegin",
        displayIndentGuides: true,
        enableAutoIndent: true,
        fixedWidthGutter: true,
        showLineNumbers: true,
      }}
      value={request.test} />
  )
})