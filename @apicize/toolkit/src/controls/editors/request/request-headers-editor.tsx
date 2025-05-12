import { NameValueEditor } from '../name-value-editor'
import { observer } from 'mobx-react-lite'
import { Box } from '@mui/material'
import { useWorkspace } from '../../../contexts/workspace.context'
import { EditableRequestHeaders } from '../../../models/workspace/editable-request-headers'

export const RequestHeadersEditor = observer((props: { headers: EditableRequestHeaders | null }) => {
  const workspace = useWorkspace()
  workspace.nextHelpTopic = 'requests/headers'

  const headerInfo = props.headers

  if (!headerInfo) {
    const workspace = useWorkspace()
    workspace.activeSelection?.initializeHeaders()
    return null
  }


  return (
    <Box width='100%' height='100' position='relative'>
      <NameValueEditor
        title='request header'
        values={headerInfo.headers}
        nameHeader='Header'
        valueHeader='Value'
        onUpdate={(pairs) => headerInfo.setHeaders(pairs)} />
    </Box>
  )
})