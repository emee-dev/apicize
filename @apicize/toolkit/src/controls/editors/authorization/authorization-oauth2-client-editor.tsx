import { Button, FormControl, Grid2, InputLabel, MenuItem, Select, TextField } from "@mui/material"
import { observer } from "mobx-react-lite"
import { useWorkspace } from "../../../contexts/workspace.context"
import { EditableAuthorization } from "../../../models/workspace/editable-authorization"
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { NO_SELECTION_ID } from "../../../models/store"
import { EntitySelection } from "../../../models/workspace/entity-selection"
import { ToastSeverity, useFeedback } from "../../../contexts/feedback.context"

export const AuthorizationOAuth2ClientEditor = observer(() => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    if (workspace.active?.entityType !== EditableEntityType.Authorization) return null
    const auth = workspace.active as EditableAuthorization

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const clearTokens = async () => {
        try {
            await workspace.clearTokens()
            feedback.toast('OAuth tokens cleared', ToastSeverity.Info)
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    return <Grid2 container direction={'column'} spacing={3} maxWidth='60em' className='authorization-editor-subpanel'>
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
                id='auth-oauth2-client-secret'
                label='Client Secret'
                aria-label='oauth client secret'
                value={auth.clientSecret}
                onChange={e => workspace.setAuthorizationClientSecret(e.target.value)}
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
        <Grid2 container direction='row' spacing='2em'>
            <FormControl>
                <InputLabel id='cred-cert-label'>Certificate</InputLabel>
                <Select
                    labelId='cred-cert-label'
                    aria-label='client certificate to use on oauth token requests'
                    id='cred-cert'
                    label='Certificate'
                    value={auth.selectedCertificate?.id ?? NO_SELECTION_ID}
                    sx={{ minWidth: '8em' }}
                    onChange={(e) => workspace.setAuthorizationSelectedCertificateId(e.target.value)}
                    size='small'
                    fullWidth
                >
                    {itemsFromSelections(workspace.getAuthorizationCertificateList())}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cred-proxy-label'>Proxy</InputLabel>
                <Select
                    labelId='cred-proxy-label'
                    aria-label='proxy to use on oauth token requests'
                    id='cred-proxy'
                    label='Proxy'
                    value={auth.selectedProxy?.id ?? NO_SELECTION_ID}
                    sx={{ minWidth: '8em' }}
                    onChange={(e) => workspace.setAuthorizationSelectedProxyId(e.target.value)}
                    size='small'
                    fullWidth
                >
                    {itemsFromSelections(workspace.getAuthorizationProxyList())}
                </Select>
            </FormControl>
        </Grid2>
        <Grid2>
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
