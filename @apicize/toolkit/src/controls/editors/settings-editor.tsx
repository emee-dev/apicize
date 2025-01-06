import { Stack, SxProps, FormControl, InputLabel, MenuItem, Select, Box, ToggleButton, ToggleButtonGroup, IconButton, SupportedColorScheme, Alert, Button, TextField } from '@mui/material'
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../contexts/workspace.context';
import { useFileOperations } from '../../contexts/file-operations.context';
import { useFeedback, ToastSeverity } from '../../contexts/feedback.context';
import { EntitySelection } from '../../models/workbook/entity-selection';
import { EditorTitle } from '../editor-title';
import AltRouteIcon from '@mui/icons-material/AltRoute'
import SettingsIcon from '@mui/icons-material/Settings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DisplaySettingsIcon from '@mui/icons-material/DisplaySettings';
import React, { useRef, useState } from 'react';
import { useApicizeSettings } from '../../contexts/apicize-settings.context';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { EditableWorkbookDefaults } from '../../models/workbook/editable-workbook-defaults';

const ParametersEditor = observer(() => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Defaults || workspace.helpVisible) return null
    const defaults = workspace.active as EditableWorkbookDefaults

    workspace.nextHelpTopic = 'settings/parameters'

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const lists = workspace.getDefaultParameterLists()

    return <Stack spacing={3}>
        <FormControl>
            <InputLabel id='scenario-label-id'>Scenarios</InputLabel>
            <Select
                labelId='scenario-label'
                aria-labelledby='scenario-label-id'
                id='cred-scenario'
                label='Scenario'
                value={defaults.selectedScenario.id}
                onChange={(e) => workspace.setDefaultScenarioId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.scenarios)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='auth-label-id'>Authorization</InputLabel>
            <Select
                labelId='auth-label'
                aria-labelledby='auth-label-id'
                id='cred-auth'
                label='Authorization'
                value={defaults.selectedAuthorization.id}
                onChange={(e) => workspace.setDefaultAuthorizationId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.authorizations)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='cert-label-id'>Certificate</InputLabel>
            <Select
                labelId='cert-label'
                aria-labelledby='cert-label-id'
                id='cred-cert'
                label='Certificate'
                value={defaults.selectedCertificate.id}
                onChange={(e) => workspace.setDefaultCertificateId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.certificates)}
            </Select>
        </FormControl>
        <FormControl>
            <InputLabel id='proxy-label-id'>Proxy</InputLabel>
            <Select
                labelId='proxy-label'
                aria-labelledby='proxy-label-id'
                id='cred-proxy'
                label='Proxy'
                value={defaults.selectedProxy.id}
                onChange={(e) => workspace.setDefaultProxyId(e.target.value)}
                size='small'
                fullWidth
            >
                {itemsFromSelections(lists.proxies)}
            </Select>
        </FormControl>
    </Stack>
})

const ApplicationSettingsEditor = observer(() => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const settings = useApicizeSettings()
    const fileOps = useFileOperations()
    const [canIncrease, setCanIncrease] = useState(settings.fontSize > 6)
    const [canDecrease, setCanDecrease] = useState(settings.fontSize < 48)

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

    return <Box>
        <Stack direction={'column'} spacing={2}>
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
    </Box >
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

export const SettingsEditor = observer((props: { sx: SxProps }) => {
    const workspace = useWorkspace()

    const lastPanel = useRef('Parameters')
    const [panel, setPanel] = useState(lastPanel.current)

    if (workspace.active?.entityType !== EditableEntityType.Defaults || workspace.helpVisible) return null

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) {
            lastPanel.current = newValue
            setPanel(newValue)
        }
    }

    let hasWarnings = (workspace.workspace.defaults.warnings?.size ?? 0) > 0

    let usePanel = panel
    if (usePanel === 'Warnings' && !hasWarnings) {
        usePanel = 'Parameters'
    }

    return (
        <Box className='editor'>
            <Box className='editor-single-panel'>
                <Stack direction='row' className='editor-panel-header'>
                    <EditorTitle icon={<SettingsIcon />} name={`Settings - ${usePanel}`} />
                </Stack>
                <Stack direction='row' flexGrow={1}>
                    <ToggleButtonGroup
                        className='button-column'
                        orientation='vertical'
                        exclusive
                        onChange={handlePanelChanged}
                        value={usePanel}
                        sx={{ marginRight: '24px' }}
                        aria-label="text alignment">
                        <ToggleButton value="Parameters" title="Show Default Request Parameters" aria-label='show default parameters' size='small'><AltRouteIcon /></ToggleButton>
                        <ToggleButton value="Application" title="Show Application Setttings" aria-label='show application settings' size='small'><DisplaySettingsIcon /></ToggleButton>
                        ({
                            hasWarnings
                                ? <ToggleButton hidden={true} value="Warnings" title="Request Warnings" aria-label='show warnings'><WarningAmberIcon sx={{ color: '#FFFF00' }} /></ToggleButton>
                                : null
                        })
                    </ToggleButtonGroup>
                    <Box flexGrow={1} className='panels'>
                        {usePanel === 'Parameters' ? <ParametersEditor />
                            : usePanel === 'Application' ? <ApplicationSettingsEditor />
                                : usePanel === 'Warnings' ? <EditWarningsEditor warnings={workspace.workspace.defaults?.warnings} />
                                    : null}
                    </Box>
                </Stack>
            </Box>
        </Box>
    )
})

