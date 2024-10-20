import { NameValueEditor } from '../name-value-editor'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'
import { Box } from '@mui/material'

export const RequestHeadersEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  workspace.nextHelpTopic = 'requests/headers'
  const request = workspace.active as EditableWorkbookRequest
  return (
    <Box width='100%' height='100' position='relative'>
      <NameValueEditor
        title='request header'
        values={request.headers}
        nameHeader='Header'
        valueHeader='Value'
        onUpdate={(pairs) => workspace.setRequestHeaders(pairs)} />
    </Box>
  )
})