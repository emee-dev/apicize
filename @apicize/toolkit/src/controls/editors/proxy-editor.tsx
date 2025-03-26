import { Stack, TextField, SxProps, Grid2, Box } from '@mui/material'
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import { EditorTitle } from '../editor-title';
import { observer } from 'mobx-react-lite';
import { EditableProxy } from '../../models/workspace/editable-proxy';
import { useWorkspace } from '../../contexts/workspace.context';
import { useWorkspaceSession } from '../../contexts/workspace-session.context';

export const ProxyEditor = observer((props: {
    sx?: SxProps
    proxy: EditableProxy
}) => {
    const session = useWorkspaceSession()
    session.nextHelpTopic = 'proxies'

    return (
        <Stack direction='column' className='editor proxy' sx={props.sx}>
            <Box className='editor-panel-header'>
                <EditorTitle icon={<AirlineStopsIcon color='proxy' />} name={props.proxy.name.length > 0 ? props.proxy.name : '(Unnamed)'} />
            </Box>
            <Box className='editor-panel'>
                <Grid2 container className='editor-content' direction={'column'} spacing={3}>
                    <Grid2>
                        <TextField
                            id='proxy-name'
                            label='Name'
                            aria-label='proxy name'
                            size='small'
                            value={props.proxy.name}
                            onChange={e => {
                                props.proxy.setName(e.target.value)
                            }}
                            error={props.proxy.nameInvalid}
                            helperText={props.proxy.nameInvalid ? 'Proxy name is required' : ''}
                            fullWidth
                        />
                    </Grid2>
                    <Grid2>
                        <TextField
                            id='proxy-url'
                            label='URL'
                            aria-label='proxy url'
                            size='small'
                            value={props.proxy.url}
                            onChange={e => {
                                props.proxy.setUrl(e.target.value)
                            }}
                            error={props.proxy.urlInvalid}
                            helperText={props.proxy.urlInvalid ? 'URL must include http/https/socks5 protocol prefix and address' : ''}
                            fullWidth
                        />
                    </Grid2>
                </Grid2>
            </Box>
        </Stack >
    )
})
