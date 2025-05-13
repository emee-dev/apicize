import { Box, IconButton, Stack, SvgIcon, SxProps, Theme } from "@mui/material"
import { observer } from "mobx-react-lite"
import { useLog } from "../../contexts/log.context"
import { ReqwestEvent } from "../../models/trace"
import { EditorTitle } from "../editor-title"
import LogIcon from "../../icons/log-icon"
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { useRef } from "react"
import { useClipboard } from "../../contexts/clipboard.context"
import { useWorkspace } from "../../contexts/workspace.context"
import { reaction } from "mobx"

export const LogViewer = observer((props: {
    sx?: SxProps<Theme>
}) => {
    const log = useLog()
    const workspace = useWorkspace()
    const clipboard = useClipboard()
    const bottomRef = useRef<HTMLDivElement | null>(null);

    let ctr = 0

    // useEffect(() => {
    //     log.checkInitialized(workspace)
    //         .catch(e => feedback.toastError(e))
    // }, [])

    reaction(
        () => log.events.length,
        (_) => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    )

    const nextCtr = () => {
        ctr += 1
        ctr
    }

    const renderEvent = (e: ReqwestEvent) => {
        switch (e.event) {
            case 'Connect':
                return <Box sx={{ position: 'relative' }} key={`console-${nextCtr()}`}>{e.timestamp} CONNECT {e.host}</Box>
            case 'Read':
            case 'Write':
                return <Box sx={{ position: 'relative' }} key={`console-${nextCtr()}`}>{e.timestamp} ${e.event.toUpperCase()} [{e.id}]
                    <Box marginLeft='3em'>
                        <pre className='log'>
                            {e.data}
                        </pre>
                    </Box>
                </Box>
            default:
                return <></>
        }
    }

    const eventsToText = () => {
        return log.events.map(e => {
            switch (e.event) {
                case 'Connect':
                    return `${e.timestamp} CONNECT ${e.host}`
                case 'Read':
                case 'Write':
                    return `${e.timestamp} ${e.event.toUpperCase()} [${e.id}]\r\n${e.data.replaceAll('\r\n', '\n').split('\n').map(l => '   ' + l).join('\r\n')}`
                default:
                    return ''
            }
        }).join('\r\n\r\n')
    }

    return <Stack display='flex' direction='column' className='log-panel'>
        <Box className='editor-panel-header' flexGrow={0}>
            <EditorTitle icon={<SvgIcon><LogIcon /></SvgIcon>} name='Communication Logs'>
                <Box>
                    <IconButton
                        aria-label="copy text to clipboard"
                        title="Copy Text to Clipboard"
                        size='medium'
                        color='primary'
                        sx={{ marginLeft: '1rem' }}
                        onClick={_ => clipboard.writeTextToClipboard(eventsToText())}>
                        <ContentCopyIcon />
                    </IconButton>
                    <IconButton color='primary' size='medium' aria-label='Clear' title='Clear Entries' onClick={() => log.clear()}><ClearAllIcon fontSize='inherit' /></IconButton>
                    <IconButton color='primary' size='medium' aria-label='Close' title='Close' onClick={() => workspace.returnToNormal()}><CloseIcon fontSize='inherit' /></IconButton>
                </Box>
            </EditorTitle>
        </Box>
        <Box className='editor-panel' display='flex' flexGrow={1} bottom={0} position='relative' maxWidth='None'>
            <Stack direction={'column'} spacing={1} className='console' paddingBottom='2em' paddingRight='2em' flexGrow='1'>
                {log.events.map(renderEvent)}
                <div ref={bottomRef} />
            </Stack>
        </Box>
    </Stack>
})

