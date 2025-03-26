import { NameValueEditor } from '../name-value-editor'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useWorkspaceSession } from '../../../contexts/workspace-session.context'

export const RequestQueryStringEditor = observer((props: { request: EditableRequest }) => {
  const session = useWorkspaceSession()
  session.nextHelpTopic = 'requests/query'

  return (<NameValueEditor
    title='query string parameter'
    values={props.request.queryStringParams}
    nameHeader='Parameter'
    valueHeader='Value'
    onUpdate={(params) => props.request.setQueryStringParams(params)} />
  )
})