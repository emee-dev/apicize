import { NameValueEditor } from '../name-value-editor'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestHeadersEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  const request = workspace.active as EditableWorkbookRequest
  return (<NameValueEditor
    title='request headers'
    values={request.headers}
    nameHeader='Header'
    valueHeader='Value'
    onUpdate={(pairs) => workspace.setRequestHeaders(pairs)} />
  )
})