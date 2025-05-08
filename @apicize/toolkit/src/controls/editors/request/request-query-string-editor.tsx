import { NameValueEditor } from '../name-value-editor'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestQueryStringEditor = observer((props: { request: EditableRequest }) => {
  const workspace = useWorkspace()
  workspace.nextHelpTopic = 'requests/query'

  return (<NameValueEditor
    title='query string parameter'
    values={props.request.queryStringParams}
    nameHeader='Parameter'
    valueHeader='Value'
    onUpdate={(params) => props.request.setQueryStringParams(params)} />
  )
})