import { TextField, Select, MenuItem, FormControl, InputLabel, Stack, SxProps, Grid2, Box } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock';
import { WorkbookAuthorizationType } from '@apicize/lib-typescript';
import { EditorTitle } from '../editor-title';
import { PersistenceEditor } from './persistence-editor';
import { EditableWorkbookAuthorization } from '../../models/workbook/editable-workbook-authorization';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { useWorkspace } from '../../contexts/workspace.context';
import { AuthorizationApiKeyEditor } from './authorization/authorization-apikey-editor';
import { AuthorizationBasicEditor } from './authorization/authorization-basic-editor';
import { AuthorizationOAuth2ClientEditor } from './authorization/authorization-oauth2-client-editor';
import { AuthorizationOAuth2PkceEditor } from './authorization/authorization-oauth2-pkce-editor';

export const AuthorizationEditor = observer((props: {
    sx: SxProps
}) => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Authorization || workspace.helpVisible) return null

    const auth = workspace.active as EditableWorkbookAuthorization

    return (
        <Stack className='editor' direction={'column'} sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<LockIcon color='authorization' />} name={auth.name} />
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
                                    WorkbookAuthorizationType.Basic
                                    | WorkbookAuthorizationType.ApiKey
                                    | WorkbookAuthorizationType.OAuth2Client
                                    | WorkbookAuthorizationType.OAuth2Pkce)}
                            >
                                <MenuItem value={WorkbookAuthorizationType.Basic}>Basic Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.ApiKey}>API Key Authentication</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.OAuth2Client}>OAuth2 Client Flow</MenuItem>
                                <MenuItem value={WorkbookAuthorizationType.OAuth2Pkce}>OAuth2 PKCE Flow</MenuItem>
                            </Select>
                        </FormControl>
                        <PersistenceEditor onUpdatePersistence={(e) => workspace.setAuthorizationPersistence(e)} persistence={auth.persistence} />
                    </Grid2>
                </Grid2>
                <Grid2>
                    {
                        auth.type === WorkbookAuthorizationType.ApiKey ?
                            <AuthorizationApiKeyEditor />
                            : auth.type === WorkbookAuthorizationType.Basic
                                ? <AuthorizationBasicEditor />
                                : auth.type === WorkbookAuthorizationType.OAuth2Client
                                    ? <AuthorizationOAuth2ClientEditor />
                                    : auth.type === WorkbookAuthorizationType.OAuth2Pkce
                                    ? <AuthorizationOAuth2PkceEditor />
                                    : null
                    }
                </Grid2>
            </Grid2>
        </Stack>
    )
})