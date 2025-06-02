import { Stack, SxProps, InputLabel, MenuItem, Select, Box, SupportedColorScheme, Alert, Button, TextField, SvgIcon, IconButton, FormControlLabel, RadioGroup, Radio } from '@mui/material'
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../contexts/workspace.context';
import { useFileOperations } from '../../contexts/file-operations.context';
import { useFeedback, ToastSeverity } from '../../contexts/feedback.context';
import { EditorTitle } from '../editor-title';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useApicize } from '../../contexts/apicize.context';
import { ExecutionReportFormat } from '@apicize/lib-typescript';

export const SettingsEditor = observer((props: { sx?: SxProps }) => {
    const apicize = useApicize()
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const fileOps = useFileOperations()

    workspace.nextHelpTopic = 'settings'

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
        }, 500)
    }

    const setFontSize = (size: number) => {
        apicize.setFontSize(size)
        checkSave(++saveCtr)
    }

    const setNavigationFontSize = (size: number) => {
        apicize.setNavigationFontSize(size)
        checkSave(++saveCtr)
    }

    const setScheme = (scheme: SupportedColorScheme) => {
        apicize.setColorScheme(scheme)
        checkSave(++saveCtr)
    }

    const setPkceListenerPort = (port: number) => {
        apicize.setPkceListenerPort(port)
        checkSave(++saveCtr)
    }

    const setAlwaysHideNavTree = (value: boolean) => {
        apicize.setAlwaysHideNavTree(value)
        checkSave(++saveCtr)
    }

    const setShowDiagnosticInfo = (value: boolean) => {
        apicize.setShowDiagnosticInfo(value)
        checkSave(++saveCtr)
    }

    const setReportFormat = (value: ExecutionReportFormat) => {
        apicize.setReportFormat(value)
        checkSave(++saveCtr)
    }

    const resetToDefaults = async () => {
        if (await feedback.confirm({
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true,
            message: 'Are you sure you want to reset to default settings?'
        })) {
            fileOps.generateDefaultSettings()
                .then(settings => {
                    apicize.update(settings)
                    checkSave(++saveCtr)
                })
                .catch(e => feedback.toastError(e))
        }
    }

    const changeWorkbookDirectory = () => {
        fileOps.selectWorkbookDirectory()
            .then(d => {
                if (d && d !== apicize.workbookDirectory) {
                    apicize.setWorkbookDirectory(d)
                    checkSave(++saveCtr)
                    feedback.toast(`Workbook directory changed to ${d}`, ToastSeverity.Info)
                }
            })
            .catch(e => feedback.toastError(e))
    }

    return <Stack direction={'column'} className='editor' sx={props.sx}>
        <Box className='editor-panel-header'>
            <EditorTitle icon={<SvgIcon><SettingsIcon /></SvgIcon>} name='Settings'>
                <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => workspace.returnToNormal()}><CloseIcon fontSize='inherit' /></IconButton>
            </EditorTitle>
        </Box>
        <Box className='editor-panel'>
            <Stack className='editor-content' spacing={2}>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='text-size-label-id' sx={{ width: '12em' }} >Main Text Size:</InputLabel>
                    <TextField type='number' slotProps={{ htmlInput: { min: 6, max: 120 } }}
                        size='small'
                        value={apicize.fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))} />
                </Stack>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='text-size-label-id' sx={{ width: '12em' }} >Navigation Text Size:</InputLabel>
                    <TextField type='number' slotProps={{ htmlInput: { min: 6, max: 120 } }}
                        size='small'
                        value={apicize.navigationFontSize}
                        onChange={(e) => setNavigationFontSize(parseInt(e.target.value))} />
                </Stack>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='hide-nav-menu-label-id' sx={{ width: '12em' }}>Alwaays Hide Nav Menu:</InputLabel>
                    <RadioGroup row value={apicize.alwaysHideNavTree} onChange={(e) => setAlwaysHideNavTree(e.target.value === 'true')}>
                        <FormControlLabel value={true} control={<Radio />} label='Yes' />
                        <FormControlLabel value={false} control={<Radio />} label='No' />
                    </RadioGroup>
                </Stack>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='color-mode-label-id' sx={{ width: '12em' }}>Color Mode:</InputLabel>
                    <Select
                        value={apicize.colorScheme}
                        onChange={(e) => setScheme(e.target.value as SupportedColorScheme)}
                        size='small'
                    >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                    </Select>
                </Stack>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='directory-label-id' sx={{ width: '12em' }}>Workbook Directory:</InputLabel>
                    <InputLabel>{apicize.workbookDirectory}</InputLabel>
                    <Button variant="outlined" onClick={changeWorkbookDirectory}>Set</Button>
                </Stack>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='rpt-fmt-label-id' sx={{ width: '12em' }}>Clipboard Format:</InputLabel>
                    <RadioGroup row value={apicize.reportFormat} onChange={(e) => setReportFormat(e.target.value as ExecutionReportFormat)}>
                        <FormControlLabel value={ExecutionReportFormat.JSON} control={<Radio />} label='JSON' />
                        <FormControlLabel value={ExecutionReportFormat.CSV} control={<Radio />} label='CSV' />
                    </RadioGroup>
                </Stack>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='pkce-port-label-id' sx={{ width: '12em' }}>PKCE Listener Port:</InputLabel>
                    <TextField type='number' slotProps={{ htmlInput: { min: 1, max: 65535 } }}
                        value={apicize.pkceListenerPort}
                        size='small'
                        onChange={(e) => setPkceListenerPort(parseInt(e.target.value))} />
                </Stack>
                <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                    <InputLabel id='diag-info-label-id' sx={{ width: '12em' }}>Show Diagnostic Info:</InputLabel>
                    <RadioGroup row value={apicize.showDiagnosticInfo} onChange={(e) => setShowDiagnosticInfo(e.target.value === 'true')}>
                        <FormControlLabel value={true} control={<Radio />} label='Yes' />
                        <FormControlLabel value={false} control={<Radio />} label='No' />
                    </RadioGroup>
                </Stack>
                <Box paddingTop='2em'>
                    <Button variant="outlined" aria-label="defaults" startIcon={<RestartAltIcon />} onClick={() => resetToDefaults()}>Reset to Defaults</Button>
                </Box>
            </Stack>
        </Box>
    </Stack >
})
