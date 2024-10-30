import { EditableEntityType } from "../../../models/workbook/editable-entity-type";
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from "../../../models/workbook/editable-workbook-request";
import { observer } from "mobx-react-lite";
import { useWorkspace } from "../../../contexts/workspace.context";
import { Alert, Box } from "@mui/material";
import { toJS } from "mobx";

export const RequestWarningsEditor = observer(() => {
  const workspace = useWorkspace()

  if (workspace.active?.entityType !== EditableEntityType.Request) {
    return null
  }

  workspace.nextHelpTopic = 'requests/parameters'
  const request = workspace.active as EditableWorkbookRequest
  const group = workspace.active as EditableWorkbookRequestGroup
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
    return null
  }
})