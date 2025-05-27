import { Grid, TextField } from "@mui/material"
import { observer } from "mobx-react-lite"
import { EditableAuthorization } from "../../../models/workspace/editable-authorization"

export const AuthorizationBasicEditor = observer((props: { authorization: EditableAuthorization }) => {
    return <Grid container direction={'column'} spacing={3} className='authorization-editor-subpanel'>
        <Grid>
            <TextField
                id='auth-username'
                label="Username"
                aria-label='authorization user name'
                value={props.authorization.username}
                error={props.authorization.usernameInvalid}
                helperText={props.authorization.usernameInvalid ? 'Username is required' : ''}
                onChange={e => props.authorization.setUsername(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid>
        <Grid>
            <TextField
                id='auth-password'
                label="Password"
                aria-label='authorization password'
                value={props.authorization.password}
                onChange={e => props.authorization.setPassword(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid>
    </Grid>
})
