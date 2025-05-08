import { NameValueEditor } from '../name-value-editor'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { Box } from '@mui/material'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestHeadersEditor = observer((props: { request: EditableRequest }) => {
  const workspace = useWorkspace()
  workspace.nextHelpTopic = 'requests/headers'

  return (
    <Box width='100%' height='100' position='relative'>
      <NameValueEditor
        title='request header'
        values={props.request.headers}
        nameHeader='Header'
        valueHeader='Value'
        onUpdate={(pairs) => props.request.setHeaders(pairs)} />
    </Box>
  )
})