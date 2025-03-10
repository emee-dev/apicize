import { Alert, Button, Grid2, TextField } from "@mui/material"
import { observer } from "mobx-react-lite"
import { useWorkspace } from "../../../contexts/workspace.context"
import { EditableAuthorization } from "../../../models/workspace/editable-authorization"
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { ToastSeverity, useFeedback } from "../../../contexts/feedback.context"

export const AuthorizationOAuth2PkceEditor = observer(() => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    if (workspace.active?.entityType !== EditableEntityType.Authorization) return null
    const auth = workspace.active as EditableAuthorization

    const clearTokens = async () => {
        try {
            await workspace.clearTokens()
            feedback.toast('OAuth tokens cleared', ToastSeverity.Info)
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    return <Grid2 container direction={'column'} spacing={3} className='authorization-editor-subpanel'>
        <Grid2>
            <Alert severity="warning">PKCE authorization requires user interaction and will not available from the Apicize CLI test runner.</Alert>
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-auth-url'
                label='Authorization URL'
                aria-label='oauth auth url'
                value={auth.authorizeUrl}
                error={auth.authorizationUrlInvalid}
                helperText={auth.accessTokenUrlInvalid ? 'Authorization URL is required' : ''}
                onChange={e => workspace.setAuthorizationUrl(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-access-token-url'
                label='Access Token URL'
                aria-label='oauth access token url'
                value={auth.accessTokenUrl}
                error={auth.accessTokenUrlInvalid}
                helperText={auth.accessTokenUrlInvalid ? 'Access Token URL is required' : ''}
                onChange={e => workspace.setAccessTokenUrl(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-client-id'
                label='Client ID'
                aria-label='oauth client id'
                value={auth.clientId}
                error={auth.clientIdInvalid}
                helperText={auth.clientIdInvalid ? 'Client ID is required' : ''}
                onChange={e => workspace.setAuthorizationClientId(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-scope'
                label='Scope'
                aria-label='oauth scope'
                value={auth.scope}
                onChange={e => workspace.setAuthorizationScope(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2 container spacing={2}>
            <Button variant='outlined'
                aria-label='Request access token'
                onClick={() => {
                    workspace.initializePkce(auth.id)
                }}>Request Token</Button>
            <Button
                color='warning'
                aria-label='Clear cached oauth tokens'
                variant='outlined'
                // startIcon={<ClearIcon />}
                onClick={clearTokens}>
                Clear Any Cached Token
            </Button>
        </Grid2>
        {
            // <Grid2>
            //     <FormControl>
            //         <InputLabel id='auth-oauth2-creds-lbl-id'>Credential Method</InputLabel>
            //         <Select
            //             labelId='auth-oauth2-creds-lbl-id'
            //             id='auth-oauth2-creds-id'
            //             value={sendCredentialsInBody}
            //             label='Credential Method'
            //             onChange={e => updateSendCredentialsInBody(e.target.value)}
            //         >
            //             <MenuItem value='no'>Send Credentials in Auth Header</MenuItem>
            //             <MenuItem value='yes'>Send Credentials in Body</MenuItem>
            //         </Select>
            //     </FormControl>
            // </Grid2>
        }
    </Grid2 >
})
