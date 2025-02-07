import { NameValueEditor } from '../name-value-editor'
import { EditableEntityType } from '../../../models/workspace/editable-entity-type'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'
import { Box } from '@mui/material'

export const RequestHeadersEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  workspace.nextHelpTopic = 'requests/headers'
  const request = workspace.active as EditableRequest
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