import { Alert, Button, FormControl, FormControlLabel, FormLabel, Grid2, Radio, RadioGroup, TextField } from "@mui/material"
import { observer } from "mobx-react-lite"
import { useWorkspace } from "../../../contexts/workspace.context"
import { EditableAuthorization } from "../../../models/workspace/editable-authorization"
import { EntityType } from "../../../models/workspace/entity-type"
import { ToastSeverity, useFeedback } from "../../../contexts/feedback.context"

export const AuthorizationOAuth2PkceEditor = observer((props: { authorization: EditableAuthorization }) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

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
                value={props.authorization.authorizeUrl}
                error={props.authorization.authorizationUrlInvalid}
                helperText={props.authorization.accessTokenUrlInvalid ? 'Authorization URL is required' : ''}
                onChange={e => props.authorization.setUrl(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-access-token-url'
                label='Access Token URL'
                aria-label='oauth access token url'
                value={props.authorization.accessTokenUrl}
                error={props.authorization.accessTokenUrlInvalid}
                helperText={props.authorization.accessTokenUrlInvalid ? 'Access Token URL is required' : ''}
                onChange={e => props.authorization.setAccessTokenUrl(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-client-id'
                label='Client ID'
                aria-label='oauth client id'
                value={props.authorization.clientId}
                error={props.authorization.clientIdInvalid}
                helperText={props.authorization.clientIdInvalid ? 'Client ID is required' : ''}
                onChange={e => props.authorization.setClientId(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <FormControl>
                <FormLabel id='lbl-auth-send-creds'>Send Crendentials In</FormLabel>
                <RadioGroup defaultValue='false' name='auth-send-creds' aria-labelledby="auth-send-creds" value={props.authorization.sendCredentialsInBody} row onChange={e => props.authorization.setCredentialsInBody(e.target.value === 'true')}>
                    <FormControlLabel value={false} control={<Radio />} label='Basic Authorization' />
                    <FormControlLabel value={true} control={<Radio />} label='Body' />
                </RadioGroup>
            </FormControl>
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-scope'
                label='Scope'
                aria-label='oauth scope'
                value={props.authorization.scope}
                onChange={e => props.authorization.setScope(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2>
            <TextField
                id='auth-oauth2-aud'
                label='Audience'
                aria-label='oauth audience'
                value={props.authorization.audience}
                onChange={e => props.authorization.setAudience(e.target.value)}
                size='small'
                fullWidth
            />
        </Grid2>
        <Grid2 container spacing={2}>
            <Button variant='outlined'
                aria-label='Request access token'
                onClick={() => {
                    workspace.initializePkce(props.authorization.id)
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
    </Grid2 >
})
