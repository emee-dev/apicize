import { observer } from "mobx-react-lite";
import { useWorkspace } from "../../../contexts/workspace.context";
import { Alert, Box } from "@mui/material";
import { EditableRequestEntry } from "../../../models/workspace/editable-request-entry";
import { useWorkspaceSession } from "../../../contexts/workspace-session.context";

export const RequestWarningsEditor = observer((props: { requestEntry: EditableRequestEntry }) => {
  const workspace = useWorkspace()
  const session = useWorkspaceSession()

  session.nextHelpTopic = 'requests/parameters'
  const warnings = props.requestEntry.warnings
  if (warnings && (warnings.size > 0)) {
    return (
      <Box>
        {
          [...warnings.entries()].map(e =>
            <Alert variant='outlined' severity='warning' onClose={() => workspace.deleteRequestWarning(props.requestEntry, e[0])}>
              {e[1]}
            </Alert>)
        }
      </Box>
    )
  } else {
    return <Box>Nee!</Box>
  }
})