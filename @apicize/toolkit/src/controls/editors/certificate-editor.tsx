import { Stack, TextField, Grid2, FormControl, InputLabel, MenuItem, Select, IconButton, Typography, SxProps, Box, SvgIcon } from '@mui/material'
import FileOpenIcon from '@mui/icons-material/FileOpen';
import { EditorTitle } from '../editor-title';
import { CertificateType } from '@apicize/lib-typescript';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { base64Decode, base64Encode } from '../../services/apicize-serializer';
import { EditableCertificate } from '../../models/workspace/editable-certificate';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workspace/editable-entity-type';
import { useClipboard } from '../../contexts/clipboard.context';
import { SshFileType, useFileOperations } from '../../contexts/file-operations.context';
import { ToastSeverity, useFeedback } from '../../contexts/feedback.context';
import CertificateIcon from '../../icons/certificate-icon';
import { useWorkspace } from '../../contexts/workspace.context';
import { useWorkspaceSession } from '../../contexts/workspace-session.context';

export const CertificateEditor = observer((props: {
    sx: SxProps,
    certificate: EditableCertificate
}) => {
    const session = useWorkspaceSession()
    const clipboard = useClipboard()
    const fileOps = useFileOperations()
    const feedback = useFeedback()

    session.nextHelpTopic = 'workspace/certificates'

    let pemToView: string = ''
    if (props.certificate.pem && (props.certificate.pem.length > 0)) {
        try {
            pemToView = (new TextDecoder('ascii')).decode(base64Decode(props.certificate.pem))
        } catch {
            pemToView = '(Invalid)'
        }
    }

    let keyToView: string = ''
    if (props.certificate.key) {
        try {
            keyToView = (new TextDecoder('ascii')).decode(base64Decode(props.certificate.key))
        } catch {
            keyToView = '(Invalid)'
        }
    }

    const pasteDataFromClipboard = async (fileType: SshFileType) => {
        try {
            const text = await clipboard.getClipboardText()
            if (text.length > 0) {
                switch (fileType) {
                    case SshFileType.PEM:
                        props.certificate.setPem(text)
                        feedback.toast('PEM pasted from clipboard', ToastSeverity.Success)
                        break
                    case SshFileType.Key:
                        props.certificate.setKey(text)
                        feedback.toast('Key pasted from clipboard', ToastSeverity.Success)
                        break
                }
            }
        } catch (e) {
            feedback.toast(`Unable to access clipboard image - ${e}`, ToastSeverity.Error)
        }
    }

    const openFile = async (fileType: SshFileType) => {
        try {
            const data = await fileOps.openSshFile(fileType)
            if (data) {
                switch (fileType) {
                    case SshFileType.PEM:
                        props.certificate.setPem(data)
                        break
                    case SshFileType.Key:
                        props.certificate.setKey(data)
                        break
                    case SshFileType.PFX:
                        props.certificate.setCertificatePfx(data)
                        break
                }
                feedback.toast(`${fileType} loaded from file`, ToastSeverity.Success)
            }
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
    }

    return (
        <Stack className='editor certificate' direction='column' sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<SvgIcon color='certificate'><CertificateIcon /></SvgIcon>} name={props.certificate.name?.length ?? 0 > 0 ? props.certificate.name : '(Unnamed)'} />
            </Box>
            <Box className='editor-panel'>
                <Stack className='editor-content' direction={'column'} spacing={3}>
                    <TextField
                        id='cert-name'
                        label='Name'
                        aria-label='name'
                        error={props.certificate.nameInvalid}
                        size='small'
                        value={props.certificate.name}
                        helperText={props.certificate.nameInvalid ? 'Name is required' : ''}
                        onChange={e => props.certificate.setName(e.target.value)}
                        fullWidth
                    />
                    <FormControl>
                        <InputLabel id='cert-type-label-id'>Type</InputLabel>
                        <Select
                            labelId='cert-type-label-id'
                            id='cert-type'
                            value={props.certificate.type}
                            label='Type'
                            size='small'
                            onChange={e => props.certificate.setType(e.target.value as
                                CertificateType.PEM | CertificateType.PKCS8_PEM | CertificateType.PKCS12)}
                        >
                            <MenuItem value={CertificateType.PKCS8_PEM}>PKCS 8 (PEM)</MenuItem>
                            <MenuItem value={CertificateType.PKCS12}>PKCS 12 (PFX)</MenuItem>
                            <MenuItem value={CertificateType.PEM}>PEM</MenuItem>
                        </Select>
                    </FormControl>
                    <Box paddingTop='2em'>
                        {
                            props.certificate.type === CertificateType.PKCS8_PEM
                                ? (
                                    <Stack direction='column' spacing={3}>
                                        <Stack direction={'row'} spacing={3} position='relative'>
                                            <Typography variant='h6' component='div'>SSL PEM Certificate / Chain</Typography>
                                            <IconButton color='primary' size='medium' aria-label='open pem certificate chain filename' title='Open Certificate PEM File'
                                                onClick={() => openFile(SshFileType.PEM)}
                                            ><FileOpenIcon fontSize='inherit' /></IconButton>
                                            <IconButton color='primary' disabled={!clipboard.hasText} size='medium' aria-label='paste-pem' title='Paste PEM from Clipboard'
                                                onClick={() => pasteDataFromClipboard(SshFileType.PEM)}><ContentPasteGoIcon fontSize='inherit' /></IconButton>
                                        </Stack>
                                        <TextField
                                            id='cert-pem'
                                            label='PEM'
                                            aria-label='pem file contents'
                                            error={props.certificate.pemInvalid}
                                            multiline
                                            slotProps={{
                                                input: {
                                                    className: 'code',
                                                    readOnly: true
                                                }
                                            }}
                                            rows={8}
                                            value={pemToView}
                                            size='small'
                                            fullWidth
                                        />
                                        <Stack direction={'row'} spacing={3} position='relative'>
                                            <Typography variant='h6' component='div'>SSL Key</Typography>
                                            <IconButton color='primary' size='medium' aria-label='open certificate key file' title='Open Certificate Key File'
                                                onClick={() => openFile(SshFileType.Key)}
                                            ><FileOpenIcon fontSize='inherit' /></IconButton>
                                            <IconButton color='primary' disabled={!clipboard.hasText} size='medium' aria-label='paste-key' title='Paste Key from Clipboard'
                                                onClick={() => pasteDataFromClipboard(SshFileType.Key)}><ContentPasteGoIcon fontSize='inherit' /></IconButton>
                                        </Stack>
                                        <TextField
                                            id='cert-key'
                                            label='Certificate Key'
                                            aria-label='certificate key file contents'
                                            error={props.certificate.keyInvalid}
                                            multiline
                                            slotProps={{
                                                input: {
                                                    className: 'code',
                                                    readOnly: true
                                                }
                                            }}
                                            rows={8}
                                            value={keyToView}
                                            size='small'
                                            fullWidth
                                        />
                                    </Stack>
                                )
                                : props.certificate.type === CertificateType.PKCS12 ? (
                                    <Stack direction={'column'} spacing={3}>
                                        <Stack direction={'row'} spacing={3} position='relative'>
                                            <Typography variant='h6' component='div'>PFX Certificate</Typography>
                                            <IconButton color='primary' size='medium' aria-label='open certificate pfx file' title='Open Certificate PFX File'
                                                onClick={() => openFile(SshFileType.PFX)}
                                            ><FileOpenIcon fontSize='inherit' /></IconButton>
                                        </Stack>
                                        <Stack direction={'row'} spacing={3}>
                                            <TextField
                                                id='cert-pfx'
                                                label='PFX'
                                                multiline
                                                slotProps={{
                                                    input: {
                                                        className: 'code',
                                                        readOnly: true
                                                    }
                                                }}
                                                rows={8}
                                                value={props.certificate.pfx ? base64Encode(new Uint8Array(Buffer.from(props.certificate.pfx))) : ''}
                                                size='small'
                                                fullWidth
                                            />
                                        </Stack>
                                        <TextField
                                            id='cert-key'
                                            label='Certificate Key'
                                            aria-label='certificate pfx file contents'
                                            className="password"
                                            value={props.certificate.password}
                                            onChange={e => props.certificate.setPassword(e.target.value)}
                                            size='small'
                                            fullWidth
                                        />
                                    </Stack>
                                ) : (
                                    <Stack direction={'column'} spacing={3}>
                                        <Stack direction={'row'} spacing={3} position='relative'>
                                            <Typography variant='h6' component='div'>SSL PEM Certificate / Chain</Typography>
                                            <IconButton color='primary' size='medium' aria-label='open pem certificate chain filename' title='Open Certificate PEM File'
                                                onClick={() => openFile(SshFileType.PEM)}
                                            ><FileOpenIcon fontSize='inherit' /></IconButton>
                                            <IconButton color='primary' disabled={!clipboard.hasText} size='medium' aria-label='paste-pem' title='Paste PEM from Clipboard'
                                                onClick={() => pasteDataFromClipboard(SshFileType.PEM)}><ContentPasteGoIcon fontSize='inherit' /></IconButton>
                                        </Stack>
                                        <Stack direction={'row'} spacing={3}>
                                            <TextField
                                                id='cert-pem'
                                                label='PEM'
                                                aria-label='pem file contents'
                                                multiline
                                                error={props.certificate.pemInvalid}
                                                slotProps={{
                                                    input: {
                                                        readOnly: true,
                                                        className: 'code'
                                                    }
                                                }}

                                                rows={8}
                                                value={pemToView}
                                                size='small'
                                                fullWidth
                                            />
                                        </Stack>
                                    </Stack>
                                )
                        }
                    </Box>
                </Stack>
            </Box>
        </Stack >
    )
})
