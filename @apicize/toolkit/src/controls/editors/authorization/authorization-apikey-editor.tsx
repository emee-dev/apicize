import { Grid, TextField } from "@mui/material"
import { observer } from "mobx-react-lite"
import { EditableAuthorization } from "../../../models/workspace/editable-authorization"

export const AuthorizationApiKeyEditor = observer((props: { authorization: EditableAuthorization }) => {
    return <Grid container direction={'column'} spacing={3} className='authorization-editor-subpanel'>
        <Grid>
            <TextField
                id='auth-header'
                label="Header"
                aria-label='authorization header name'
                value={props.authorization.header}
                error={props.authorization.headerInvalid}
                helperText={props.authorization.headerInvalid ? 'Header is required' : ''}
                onChange={e => props.authorization.setHeader(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid>
        <Grid>
            <TextField
                id='auth-value'
                label="Value"
                aria-label='authorization header value'
                value={props.authorization.value}
                error={props.authorization.valueInvalid}
                helperText={props.authorization.valueInvalid ? 'Value is required' : ''}
                onChange={e => props.authorization.setValue(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid>
    </Grid>
})
