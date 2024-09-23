import { NameValueEditor } from '../name-value-editor'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestQueryStringEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  const request = workspace.active as EditableWorkbookRequest
  return (<NameValueEditor
    title='query string parameters'
    values={request.queryStringParams}
    nameHeader='Parameter'
    valueHeader='Value'
    onUpdate={(params) => workspace.setRequestQueryStringParams(params)} />
  )
})