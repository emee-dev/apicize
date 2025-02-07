import { NameValueEditor } from '../name-value-editor'
import { EditableEntityType } from '../../../models/workspace/editable-entity-type'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestQueryStringEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  workspace.nextHelpTopic = 'requests/query'
  const request = workspace.active as EditableRequest
  return (<NameValueEditor
    title='query string parameter'
    values={request.queryStringParams}
    nameHeader='Parameter'
    valueHeader='Value'
    onUpdate={(params) => workspace.setRequestQueryStringParams(params)} />
  )
})