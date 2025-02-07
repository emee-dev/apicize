import { TextField, Select, MenuItem, FormControl, InputLabel, Stack, SxProps, Grid2, Box, SvgIcon } from '@mui/material'
import { AuthorizationType } from '@apicize/lib-typescript';
import { EditorTitle } from '../editor-title';
import { EditableAuthorization } from '../../models/workspace/editable-authorization';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workspace/editable-entity-type';
import { useWorkspace } from '../../contexts/workspace.context';
import { AuthorizationApiKeyEditor } from './authorization/authorization-apikey-editor';
import { AuthorizationBasicEditor } from './authorization/authorization-basic-editor';
import { AuthorizationOAuth2ClientEditor } from './authorization/authorization-oauth2-client-editor';
import { AuthorizationOAuth2PkceEditor } from './authorization/authorization-oauth2-pkce-editor';
import AuthIcon from '../../icons/auth-icon';

export const AuthorizationEditor = observer((props: {
    sx: SxProps
}) => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Authorization) return null

    const auth = workspace.active as EditableAuthorization
    workspace.nextHelpTopic = 'workspace/authorizations'

    return (
        <Stack className='editor' direction={'column'} sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<SvgIcon color='authorization'><AuthIcon /></SvgIcon>} name={auth.name} />
            </Box>
            <Grid2 container direction={'column'} spacing={3} className='editor-single-panel'>
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
                        size='small'
                        fullWidth
                    />
                </Grid2>
                <Grid2>
                    <Grid2 container direction={'row'} spacing={'2em'}>
                        <FormControl>
                            <InputLabel id='auth-type-label-id'>Type</InputLabel>
                            <Select
                                labelId='auth-type-label-id'
                                aria-label='authorization type'
                                id='auth-type'
                                value={auth.type}
                                label='Type'
                                size='small'
                                onChange={e => workspace.setAuthorizationType(e.target.value as
                                    AuthorizationType.Basic
                                    | AuthorizationType.ApiKey
                                    | AuthorizationType.OAuth2Client
                                    | AuthorizationType.OAuth2Pkce)}
                            >
                                <MenuItem value={AuthorizationType.Basic}>Basic Authentication</MenuItem>
                                <MenuItem value={AuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                <MenuItem value={AuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                                <MenuItem value={AuthorizationType.OAuth2Pkce}>OAuth2 PKCE Flow</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid2>
                </Grid2>
                <Grid2>
                    {
                        auth.type === AuthorizationType.ApiKey ?
                            <AuthorizationApiKeyEditor />
                            : auth.type === AuthorizationType.Basic
                                ? <AuthorizationBasicEditor />
                                : auth.type === AuthorizationType.OAuth2Client
                                    ? <AuthorizationOAuth2ClientEditor />
                                    : auth.type === AuthorizationType.OAuth2Pkce
                                        ? <AuthorizationOAuth2PkceEditor />
                                        : null
                    }
                </Grid2>
            </Grid2>
        </Stack>
    )
})