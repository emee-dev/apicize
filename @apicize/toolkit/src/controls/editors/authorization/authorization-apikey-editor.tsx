import { Grid2, TextField } from "@mui/material"
import { observer } from "mobx-react-lite"
import { useWorkspace } from "../../../contexts/workspace.context"
import { EditableAuthorization } from "../../../models/workspace/editable-authorization"
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"

export const AuthorizationApiKeyEditor = observer(() => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Authorization) return null
    const auth = workspace.active as EditableAuthorization

    return <Grid2 container direction={'column'} spacing={3} maxWidth='60em' className='authorization-editor-subpanel'>
        <Grid2>
            <TextField
                id='auth-header'
                label="Header"
                aria-label='authorization header name'
                value={auth.header}
                error={auth.headerInvalid}
                helperText={auth.headerInvalid ? 'Header is required' : ''}
                onChange={e => workspace.setAuthorizationHeader(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-value'
                label="Value"
                aria-label='authorization header value'
                value={auth.value}
                error={auth.valueInvalid}
                helperText={auth.valueInvalid ? 'Value is required' : ''}
                onChange={e => workspace.setAuthorizationValue(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
    </Grid2>
})
