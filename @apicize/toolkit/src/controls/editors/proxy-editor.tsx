import { Stack, TextField, SxProps, Grid, Box } from '@mui/material'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import { EditorTitle } from '../editor-title';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../contexts/workspace.context';
import { useApicize } from '../../contexts/apicize.context';

export const ProxyEditor = observer((props: { sx?: SxProps }) => {
    const apicize = useApicize()
    const workspace = useWorkspace()
    const activeSelection = workspace.activeSelection

    if (!activeSelection?.proxy) {
        return null
    }

    workspace.nextHelpTopic = 'proxies'
    const proxy = activeSelection.proxy

    return (
        <Stack direction='column' className='editor proxy' sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle
                    icon={<AirlineStopsIcon color='proxy' />}
                    name={proxy.name.length > 0 ? proxy.name : '(Unnamed)'}
                    diag={apicize.showDiagnosticInfo ? proxy.id : undefined}
                />
            </Box>
            <Box className='editor-panel'>
                <Grid container className='editor-content' direction={'column'} spacing={3}>
                    <Grid>
                        <TextField
                            id='proxy-name'
                            label='Name'
                            aria-label='proxy name'
                            size='small'
                            value={proxy.name}
                            autoFocus={proxy.name === ''}
                            onChange={e => {
                                proxy.setName(e.target.value)
                            }}
                            error={proxy.nameInvalid}
                            helperText={proxy.nameInvalid ? 'Proxy name is required' : ''}
                            fullWidth
                        />
                    </Grid>
                    <Grid>
                        <TextField
                            id='proxy-url'
                            label='URL'
                            aria-label='proxy url'
                            size='small'
                            value={proxy.url}
                            onChange={e => {
                                proxy.setUrl(e.target.value)
                            }}
                            error={proxy.urlInvalid}
                            helperText={proxy.urlInvalid ? 'URL must include http/https/socks5 protocol prefix and address' : ''}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </Box>
        </Stack >
    )
})
