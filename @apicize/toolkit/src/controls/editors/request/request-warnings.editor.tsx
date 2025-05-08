import { observer } from "mobx-react-lite";
import { useWorkspace } from "../../../contexts/workspace.context";
import { Alert, Box } from "@mui/material";
import { useFeedback } from "../../../contexts/feedback.context";
import { useState } from "react";
import { EditableRequestGroup } from "../../../models/workspace/editable-request-group";
import { EditableRequest } from "../../../models/workspace/editable-request";

export const RequestWarningsEditor = observer((props: { requestOrGroupId: string }) => {
  const requestOrGroupId = props.requestOrGroupId
  const workspace = useWorkspace()
  const feedback = useFeedback()

  workspace.nextHelpTopic = 'requests/parameters'

  const [requestOrGroup, setRequestOrGroup] = useState<EditableRequest | EditableRequestGroup | null>(null)

  if (requestOrGroup == null) {
    workspace.getRequestEntry(requestOrGroupId)
      .then(g => setRequestOrGroup(g))
      .catch(e => feedback.toastError(e))
    return
  }

  const warnings = requestOrGroup.warnings
  if (warnings && (warnings.size > 0)) {
    return (
      <Box>
        {
          [...warnings.entries()].map(e =>
            <Alert variant='outlined' severity='warning' onClose={() => workspace.deleteRequestWarning(requestOrGroup, e[0])}>
              {e[1]}
            </Alert>)
        }
      </Box>
    )
  } else {
    return <Box>Nee!</Box>
  }
})