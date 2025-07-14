import { Stack, SxProps, InputLabel, MenuItem, Select, Box, SupportedColorScheme, Button, TextField, SvgIcon, IconButton, FormControlLabel, RadioGroup, Radio } from '@mui/material'
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
import { BorderedSection } from '../bordered-section';

export const SettingsEditor = observer((props: { sx?: SxProps }) => {
    const apicize = useApicize()
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const fileOps = useFileOperations()

    workspace.nextHelpTopic = 'settings'

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
                })
                .catch(e => feedback.toastError(e))
        }
    }

    const changeWorkbookDirectory = () => {
        fileOps.selectWorkbookDirectory()
            .then(d => {
                if (d && d !== apicize.workbookDirectory) {
                    apicize.setWorkbookDirectory(d)
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
        <Box className='editor-panel' sx={{ paddingTop: '2em' }}>
            <Stack className='editor-content' spacing={4}>
                <BorderedSection sx={{ marginTop: '2em' }} title='Display Settings'>
                    <Stack direction='column' spacing={1}>
                        <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                            <InputLabel id='text-size-label-id' sx={{ width: '12em' }} >Main Text Size:</InputLabel>
                            <TextField type='number' slotProps={{ htmlInput: { min: 6, max: 120 } }}
                                size='small'
                                value={apicize.fontSize}
                                title='Base font size of non-navigation content'
                                onChange={(e) => apicize.setFontSize(parseInt(e.target.value))} />
                        </Stack>
                        <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                            <InputLabel id='text-size-label-id' sx={{ width: '12em' }} >Navigation Text Size:</InputLabel>
                            <TextField type='number' slotProps={{ htmlInput: { min: 6, max: 120 } }}
                                size='small'
                                value={apicize.navigationFontSize}
                                title='Base font size of navigation content'
                                onChange={(e) => apicize.setNavigationFontSize(parseInt(e.target.value))} />
                        </Stack>
                        <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                            <InputLabel id='color-mode-label-id' sx={{ width: '12em' }}>Color Mode:</InputLabel>
                            <Select
                                value={apicize.colorScheme}
                                onChange={(e) => apicize.setColorScheme(e.target.value as SupportedColorScheme)}
                                size='small'
                            >
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="dark">Dark</MenuItem>
                            </Select>
                        </Stack>
                        <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                            <InputLabel id='hide-nav-menu-label-id' sx={{ width: '12em' }}>Alwaays Hide Nav Menu:</InputLabel>
                            <RadioGroup row value={apicize.alwaysHideNavTree} onChange={(e) => apicize.setAlwaysHideNavTree(e.target.value === 'true')}>
                                <FormControlLabel value={true} control={<Radio />} label='Yes' title='Always show minimized navigation toolbar' />
                                <FormControlLabel value={false} control={<Radio />} label='No' title='Show minimized navigation toolbar only when width threshold is reached' />
                            </RadioGroup>
                        </Stack>
                    </Stack>
                </BorderedSection>
                <BorderedSection title='Editor Settings'>
                    <Stack direction='column' spacing={1}>
                        <Stack direction={'column'}>
                            <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                                <InputLabel id='diag-indent-label-id' sx={{ width: '12em' }}>Indent Size:</InputLabel>
                                <TextField type='number' slotProps={{ htmlInput: { min: 6, max: 120 } }}
                                    size='small'
                                    value={apicize.editorIndentSize}
                                    title='Set indent level for JSON, JavaScript and XML'
                                    onChange={(e) => apicize.setEditorIndentSize(parseInt(e.target.value))} />
                            </Stack>
                            <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                                <InputLabel id='detect-indent-label-id' sx={{ width: '12em' }}>Detect Existing Indent:</InputLabel>
                                <RadioGroup row value={apicize.editorDetectExistingIndent} onChange={(e) => apicize.setEditorDetectExistingIndent(e.target.value === 'true')}>
                                    <FormControlLabel value={true} control={<Radio />} label='Yes' title='Use existing detection indent level' />
                                    <FormControlLabel value={false} control={<Radio />} label='No' title='Always use indent level configured in Settings' />
                                </RadioGroup>
                            </Stack>
                            <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                                <InputLabel id='check-js-label-id' sx={{ width: '12em' }}>Check JavaScript Syntax:</InputLabel>
                                <RadioGroup row value={apicize.editorCheckJsSyntax} onChange={(e) => apicize.setEditorCheckJsSyntax(e.target.value === 'true')}>
                                    <FormControlLabel value={true} control={<Radio />} label='Yes' title='Check JavaScript syntax when editing tests' />
                                    <FormControlLabel value={false} control={<Radio />} label='No' title='Ignore JavaScript syntax errors when editing tests' />
                                </RadioGroup>
                            </Stack>
                        </Stack>
                    </Stack>
                </BorderedSection>
                <BorderedSection title='OtherSettings'>
                    <Stack direction='column' spacing={1}>
                        <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                            <InputLabel id='directory-label-id' sx={{ width: '12em' }}>Workbook Directory:</InputLabel>
                            <InputLabel>{apicize.workbookDirectory}</InputLabel>
                            <Button variant="outlined" onClick={changeWorkbookDirectory}>Set</Button>
                        </Stack>
                        <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                            <InputLabel id='pkce-port-label-id' sx={{ width: '12em' }}>PKCE Listener Port:</InputLabel>
                            <TextField type='number' slotProps={{ htmlInput: { min: 1, max: 65535 } }}
                                value={apicize.pkceListenerPort}
                                size='small'
                                onChange={(e) => apicize.setPkceListenerPort(parseInt(e.target.value))} />
                        </Stack>
                        <Stack direction={'row'} spacing={'1em'} display='flex' alignItems='center' justifyContent='left'>
                            <InputLabel id='show_diag-info-label-id' sx={{ width: '12em' }}>Show Diagnotic Info:</InputLabel>
                            <RadioGroup row value={apicize.editorCheckJsSyntax} onChange={(e) => apicize.setShowDiagnosticInfo(e.target.value === 'true')}>
                                <FormControlLabel value={true} control={<Radio />} label='Yes' title='Show IDs and other diagnostic info' />
                                <FormControlLabel value={false} control={<Radio />} label='No' title='Do not display digagnostic info' />
                            </RadioGroup>
                        </Stack>
                    </Stack>
                </BorderedSection>
                <Box>
                    <Button variant="outlined" aria-label="defaults" startIcon={<RestartAltIcon />} onClick={() => resetToDefaults()}>Reset to Defaults</Button>
                </Box>
            </Stack>
        </Box>
    </Stack >
})
