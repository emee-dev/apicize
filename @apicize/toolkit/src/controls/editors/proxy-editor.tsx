import { Stack, TextField, SxProps, Grid2, Box } from '@mui/material'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import { EditorTitle } from '../editor-title';
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workspace/editable-entity-type';
import { EditableProxy } from '../../models/workspace/editable-proxy';
import { useWorkspace } from '../../contexts/workspace.context';

export const ProxyEditor = observer((props: {
    sx: SxProps
}) => {
    const workspace = useWorkspace()
    if (workspace.active?.entityType !== EditableEntityType.Proxy) return null
    workspace.nextHelpTopic = 'proxies'
    const proxy = workspace.active as EditableProxy
    return (
        <Stack direction='column' className='editor proxy' sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<AirlineStopsIcon color='proxy' />} name={proxy.name.length > 0 ? proxy.name : '(Unnamed)'} />
            </Box>
            <Box className='editor-panel'>
                <Grid2 container className='editor-content' direction={'column'} spacing={3}>
                    <Grid2>
                        <TextField
                            id='proxy-name'
                            label='Name'
                            aria-label='proxy name'
                            size='small'
                            value={proxy.name}
                            onChange={e => workspace.setName(e.target.value)}
                            error={proxy.nameInvalid}
                            helperText={proxy.nameInvalid ? 'Proxy name is required' : ''}
                            fullWidth
                        />
                    </Grid2>
                    <Grid2>
                        <TextField
                            id='proxy-url'
                            label='URL'
                            aria-label='proxy url'
                            size='small'
                            value={proxy.url}
                            onChange={e => workspace.setProxyUrl(e.target.value)}
                            error={proxy.urlInvalid}
                            helperText={proxy.urlInvalid ? 'URL must include http/https/socks5 protocol prefix and address' : ''}
                            fullWidth
                        />
                    </Grid2>
                </Grid2>
            </Box>
        </Stack >
    )
})
