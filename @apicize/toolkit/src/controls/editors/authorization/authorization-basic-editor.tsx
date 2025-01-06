import { Grid2, TextField } from "@mui/material"
import { observer } from "mobx-react-lite"
import { useWorkspace } from "../../../contexts/workspace.context"
import { EditableWorkbookAuthorization } from "../../../models/workbook/editable-workbook-authorization"
import { EditableEntityType } from "../../../models/workbook/editable-entity-type"

export const AuthorizationBasicEditor = observer(() => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Authorization || workspace.helpVisible) return null
    const auth = workspace.active as EditableWorkbookAuthorization

    return <Grid2 container direction={'column'} spacing={3} maxWidth='60em' className='authorization-editor-subpanel'>
        <Grid2>
            <TextField
                id='auth-username'
                label="Username"
                aria-label='authorization user name'
                value={auth.username}
                error={auth.usernameInvalid}
                helperText={auth.usernameInvalid ? 'Username is required' : ''}
                onChange={e => workspace.setAuthorizationUsername(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-password'
                label="Password"
                aria-label='authorization password'
                value={auth.password}
                onChange={e => workspace.setAuthorizationPassword(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
    </Grid2>
})
