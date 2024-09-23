import { TextField, Select, MenuItem, FormControl, InputLabel, Stack, SxProps, Button, Grid2 } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { WorkbookAuthorizationType } from '@apicize/lib-typescript';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { EditableWorkbookAuthorization } from '../../models/workbook/editable-workbook-authorization';
import { EntitySelection } from '../../models/workbook/entity-selection';
import { NO_SELECTION_ID } from '../../models/store';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { useWorkspace } from '../../contexts/workspace.context';
import { ToastSeverity, useFeedback } from '../../contexts/feedback.context';

let credIndex = 0
const itemsFromSelections = (selections: EntitySelection[]) => {
    return selections.map(s => (
        <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
    ))
}

export const AuthorizationEditor = observer((props: {
    sx: SxProps
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()

    if (workspace.active?.entityType !== EditableEntityType.Authorization || workspace.helpVisible) return null

    const clearTokens = async () => {
        try {
            await workspace.clearTokens()
            feedback.toast('OAuth tokens cleared', ToastSeverity.Info)
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    const auth = workspace.active as EditableWorkbookAuthorization
    return (
        <Stack className='editor-panel-no-toolbar' direction={'column'} sx={props.sx}>
            <EditorTitle icon={<LockIcon />} name={auth.name} />
            <Grid2 container direction={'column'} spacing={3} maxWidth={1000}>
                <Grid2>
                    <TextField
                        id='auth-name'
                        label='Name'
                        aria-label='authorization name'
                        // size='small'
                        value={auth.name}
                        error={auth.nameInvalid}
                        helperText={auth.nameInvalid ? 'Name is required' : ''}
                        onChange={e => workspace.setName(e.target.value)}
                        fullWidth
                    />
                </Grid2>
                <Grid2>
                    <Stack direction={'row'} spacing={'2em'}>
                        <FormControl>
                            <InputLabel id='auth-type-label-id'>Type</InputLabel>
                            <Select
                                labelId='auth-type-label-id'
                                aria-label='authorization type'
                                id='auth-type'
                                value={auth.type}
                                label='Type'
                                onChange={e => workspace.setAuthorizationType(e.target.value as
                                    WorkbookAuthorizationType.Basic | WorkbookAuthorizationType.ApiKey | WorkbookAuthorizationType.OAuth2Client)}
                            >
                                <MenuItem value={WorkbookAuthorizationType.Basic}>Basic Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={(e) => workspace.setAuthorizationPersistence(e)} persistence={auth.persistence} />
                    </Stack>
                </Grid2>
                <Grid2>
                    {
                        auth.type === WorkbookAuthorizationType.ApiKey ?
                            <Grid2 container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
                                <Grid2>
                                    <TextField
                                        id='auth-header'
                                        label="Header"
                                        aria-label='authorization header name'
                                        value={auth.header}
                                        error={auth.headerInvalid}
                                        helperText={auth.headerInvalid ? 'Header is required' : ''}
                                        onChange={e => workspace.setAuthorizationHeader(e.target.value)}
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
                                        fullWidth
                                    />
                                </Grid2>
                            </Grid2>
                            : auth.type === WorkbookAuthorizationType.Basic
                                ? <Grid2 container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
                                    <Grid2>
                                        <TextField
                                            id='auth-username'
                                            label="Username"
                                            aria-label='authorization user name'
                                            value={auth.username}
                                            error={auth.usernameInvalid}
                                            helperText={auth.usernameInvalid ? 'Username is required' : ''}
                                            onChange={e => workspace.setAuthorizationUsername(e.target.value)}
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
                                            fullWidth
                                        />
                                    </Grid2>
                                </Grid2>
                                : auth.type === WorkbookAuthorizationType.OAuth2Client
                                    ? <Grid2 container direction={'column'} spacing={3} maxWidth={1000} className='authorization-editor-subpanel'>
                                        <Grid2>
                                            <TextField
                                                id='auth-oauth2-access-token-url'
                                                label='Access Token URL'
                                                aria-label='oauth access token url'
                                                value={auth.accessTokenUrl}
                                                error={auth.accessTokenUrlInvalid}
                                                helperText={auth.accessTokenUrlInvalid ? 'Access Token URL is required' : ''}
                                                onChange={e => workspace.setAuthorizatinoAccessTokenUrl(e.target.value)}
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
                                                fullWidth
                                            />
                                        </Grid2>
                                        <Grid2>
                                            <FormControl>
                                                <InputLabel id='cred-cert-label'>Certificate</InputLabel>
                                                <Select
                                                    labelId='cred-cert-label'
                                                    aria-label='client certificate to use on oauth token requests'
                                                    id='cred-cert'
                                                    label='Certificate'
                                                    value={auth.selectedCertificate?.id ?? NO_SELECTION_ID}
                                                    onChange={(e) => workspace.setAuthorizationSelectedCertificateId(e.target.value)}
                                                    fullWidth
                                                >
                                                    {itemsFromSelections(workspace.getAuthorizationCertificateList())}
                                                </Select>
                                            </FormControl>
                                        </Grid2>
                                        <Grid2>
                                            <FormControl>
                                                <InputLabel id='cred-proxy-label'>Proxy</InputLabel>
                                                <Select
                                                    labelId='cred-proxy-label'
                                                    aria-label='proxy to use on oauth token requests'
                                                    id='cred-proxy'
                                                    label='Proxy'
                                                    value={auth.selectedProxy?.id ?? NO_SELECTION_ID}
                                                    onChange={(e) => workspace.setAuthorizationSelectedProxyId(e.target.value)}
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
                                    : null
                    }
                </Grid2>
            </Grid2>
        </Stack>
    )
})