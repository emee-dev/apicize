import { TextField, Select, MenuItem, FormControl, InputLabel, Stack, SxProps, Grid2, Box, SvgIcon } from '@mui/material'
import { AuthorizationType } from '@apicize/lib-typescript';
import { EditorTitle } from '../editor-title';
import { EditableAuthorization } from '../../models/workspace/editable-authorization';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../contexts/workspace.context';
import { AuthorizationApiKeyEditor } from './authorization/authorization-apikey-editor';
import { AuthorizationBasicEditor } from './authorization/authorization-basic-editor';
import { AuthorizationOAuth2ClientEditor } from './authorization/authorization-oauth2-client-editor';
import { AuthorizationOAuth2PkceEditor } from './authorization/authorization-oauth2-pkce-editor';
import AuthIcon from '../../icons/auth-icon';
import { useWorkspaceSession } from '../../contexts/workspace-session.context';

export const AuthorizationEditor = observer((props: {
    sx: SxProps,
    authorization: EditableAuthorization
}) => {
    const session = useWorkspaceSession()
    session.nextHelpTopic = 'workspace/authorizations'

    return (
        <Stack className='editor authorization' direction={'column'} sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<SvgIcon color='authorization'><AuthIcon /></SvgIcon>} name={props.authorization.name} />
            </Box>
            <Box className='editor-panel'>
                <Grid2 container className='editor-content' direction={'column'} spacing={3}>
                    <Grid2>
                        <TextField
                            id='auth-name'
                            label='Name'
                            aria-label='authorization name'
                            size='small'
                            value={props.authorization.name}
                            error={props.authorization.nameInvalid}
                            helperText={props.authorization.nameInvalid ? 'Name is required' : ''}
                            onChange={e => props.authorization.setName(e.target.value)}
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
                                    value={props.authorization.type}
                                    label='Type'
                                    size='small'
                                    onChange={e => props.authorization.setType(e.target.value as AuthorizationType)}
                                >
                                    <MenuItem value={AuthorizationType.Basic}>Basic Authentication</MenuItem>
                                    <MenuItem value={AuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                    <MenuItem value={AuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                                    <MenuItem value={AuthorizationType.OAuth2Pkce}>OAuth2 PKCE Flow</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid2>
                    </Grid2>
                    <Grid2 marginTop='24px'>
                        {
                            props.authorization.type === AuthorizationType.ApiKey ?
                                <AuthorizationApiKeyEditor authorization={props.authorization} />
                                : props.authorization.type === AuthorizationType.Basic
                                    ? <AuthorizationBasicEditor authorization={props.authorization} />
                                    : props.authorization.type === AuthorizationType.OAuth2Client
                                        ? <AuthorizationOAuth2ClientEditor authorization={props.authorization} />
                                        : props.authorization.type === AuthorizationType.OAuth2Pkce
                                            ? <AuthorizationOAuth2PkceEditor authorization={props.authorization} />
                                            : null
                        }
                    </Grid2>
                </Grid2>
            </Box>
        </Stack>
    )
})