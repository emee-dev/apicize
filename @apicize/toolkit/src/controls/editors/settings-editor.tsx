import { Stack, SxProps, InputLabel, MenuItem, Select, Box, SupportedColorScheme, Alert, Button, TextField, SvgIcon, IconButton } from '@mui/material'
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../contexts/workspace.context';
import { useFileOperations } from '../../contexts/file-operations.context';
import { useFeedback, ToastSeverity } from '../../contexts/feedback.context';
import { EditorTitle } from '../editor-title';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useState } from 'react';
import { useApicizeSettings } from '../../contexts/apicize-settings.context';

export const SettingsEditor = observer((props: { sx?: SxProps }) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const settings = useApicizeSettings()
    const fileOps = useFileOperations()

    workspace.nextHelpTopic = 'settings/display'

    let saveCtr = 0
    const checkSave = (ctr: number) => {
        // Only save if the save ctr hasn't changed in the specified interval
        setTimeout(async () => {
            if (saveCtr === ctr) {
                try {
                    saveCtr = 0
                    await fileOps.saveSettings()
                } catch (e) {
                    feedback.toast(`Unable to save Settings - ${e}`, ToastSeverity.Error)
                }
            }
        }, 2000)
    }

    const setFontSize = (size: number) => {
        settings.setFontSize(size)
        checkSave(++saveCtr)
    }

    const setScheme = (scheme: SupportedColorScheme) => {
        settings.setColorScheme(scheme)
        checkSave(++saveCtr)
    }

    const setPkceListenerPort = (port: number) => {
        settings.setPkceListenerPort(port)
        checkSave(++saveCtr)
    }

    return <Stack direction={'column'} className='editor' sx={props.sx}>
        <Box className='editor-panel-header'>
            <EditorTitle icon={<SvgIcon><SettingsIcon /></SvgIcon>} name='Settings' />
            <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => workspace.returnToNormal()}><CloseIcon fontSize='inherit' /></IconButton>
        </Box>
        <Stack spacing={2}>
            <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                <InputLabel id='text-size-label-id' sx={{ width: '12em' }} >Text Size:</InputLabel>
                <TextField type='number' slotProps={{ htmlInput: { min: 6, max: 120 } }}
                    value={settings.fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))} />
            </Stack>
            <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                <InputLabel id='color-mode-label-id' sx={{ width: '12em' }}>Color Mode:</InputLabel>
                <Select
                    value={settings.colorScheme}
                    onChange={(e) => setScheme(e.target.value as SupportedColorScheme)}
                    size='small'
                >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                </Select>
            </Stack>
            <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                <InputLabel id='pkce-port-label-id' sx={{ width: '12em' }}>PKCE Listener Port:</InputLabel>
                <TextField type='number' slotProps={{ htmlInput: { min: 1, max: 65535 } }}
                    value={settings.pkceListenerPort}
                    onChange={(e) => setPkceListenerPort(parseInt(e.target.value))} />
            </Stack>
            <Box paddingTop='2em'>
                <Button variant="outlined" aria-label="defaults" startIcon={<RestartAltIcon />} onClick={() => settings.resetToDefaults()}>Reset to Defaults</Button>
            </Box>
        </Stack>
    </Stack >
})

const EditWarningsEditor = observer((props: { warnings: Map<string, string> | undefined }) => {
    const workspace = useWorkspace()
    return props.warnings ? (
        <Box>
            {
                [...props.warnings.entries()].map(e =>
                    <Alert variant='outlined' severity='warning' onClose={() => workspace.deleteWorkspaceWarning(e[0])}>
                        {e[1]}
                    </Alert>)
            }
        </Box>
    ) : null
})
