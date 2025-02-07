import 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

import AceEditor from "react-ace"
import "ace-builds/src-noconflict/mode-javascript"
import { EditableEntityType } from "../../../models/workspace/editable-entity-type";
import { EditableRequest } from "../../../models/workspace/editable-request";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "../../../contexts/workspace.context";
import { useApicizeSettings } from '../../../contexts/apicize-settings.context'

export const RequestTestEditor = observer(() => {
  const workspace = useWorkspace()
  const apicizeSettings = useApicizeSettings()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  workspace.nextHelpTopic = 'requests/test'
  const request = workspace.active as EditableRequest

  return (
    <AceEditor
      mode='javascript'
      theme={apicizeSettings.colorScheme === 'dark' ? 'gruvbox' : 'chrome'}
      fontSize={`${apicizeSettings.fontSize}pt`}
      lineHeight='1.1em'
      width='100%'
      height='100%'
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