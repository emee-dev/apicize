import { EditableEntityType } from "../../../models/workspace/editable-entity-type";
import { EditableRequest, EditableRequestGroup } from "../../../models/workspace/editable-request";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "../../../contexts/workspace.context";
import { Alert, Box } from "@mui/material";
import { toJS } from "mobx";

export const RequestWarningsEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request && workspace.active?.entityType !== EditableEntityType.Group) {
    return null
  }

  workspace.nextHelpTopic = 'requests/parameters'
  const request = workspace.active as EditableRequest
  const group = workspace.active as EditableRequestGroup
  const warnings = request
    ? request.warnings
    : group
      ? group.warnings
      : undefined

  if (warnings && (warnings.size > 0)) {
    return (
      <Box>
        {
          [...warnings.entries()].map(e =>
            <Alert variant='outlined' severity='warning' onClose={() => workspace.deleteRequestWarning(e[0])}>
              {e[1]}
            </Alert>)
        }
      </Box>
    )
  } else {
    return <Box>Nee!</Box>
  }
})