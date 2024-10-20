import { Box, Stack, SxProps } from "@mui/system"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { WorkbookExecutionGroupResult, WorkbookExecutionRequestResult, WorkbookExecutionGroupItem } from "../../../models/workbook/workbook-execution";
import { observer } from "mobx-react-lite";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";
import { toJS } from "mobx";

const fmtMinSec = (value: number, subZero: string | null = null) => {
    if (value === 0 && subZero) {
        return subZero
    }
    const m = Math.floor(value / 60000)
    value -= m * 60000
    const s = Math.floor(value / 1000)
    value -= s * 1000
    return `${m.toLocaleString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${(0.1).toLocaleString()[1]}${value.toString().padEnd(3, '0')}`   
}

const GroupResult = (props: { sx: SxProps, group: WorkbookExecutionGroupResult }) => {
    let idx = 0

    const renderGroupItem = (item: WorkbookExecutionGroupItem) => {
        const children = (item.children && item.children.length > 0) ? item.children : null
        return <Box key={`test-summary-${idx++}`}>
            <Typography sx={{ marginTop: '0.5rem', marginBottom: '0.25rem', paddingTop: 0, color: '#80000' }} component='div'>
                {item.name} ({fmtMinSec(item.executedAt, 'Start')}, {item.duration.toLocaleString()} ms)
            </Typography>
            {
                item.errorMessage
                    ? <TestInfo isError={true} text={item.errorMessage} />
                    : (item.tests && item.tests.length > 0)
                        ? item.tests.map(test => (
                            <TestResult
                                key={`test-${idx++}`}
                                name={test.testName}
                                success={test.success}
                                error={test.error}
                                logs={test.logs} />
                        ))
                        : children ? null : <TestInfo isError={false} text='(No Tests)' />
            }
            {
                children
                    ? <Box sx={{ paddingLeft: '2em' }}>{children.map(child => renderGroupItem(child))}</Box>
                    : null
            }
        </Box>
    }

    return (
        <Box key={`test-summary-${idx++}`} sx={props.sx}>
            <TestInfo text={`Executed At: ${props.group.executedAt > 0 ? `${fmtMinSec(props.group.executedAt)}` : '(Start)'}`} />
            {(props.group.duration && props.group.duration > 0)
                ? (<TestInfo text={`Duration: ${props.group.duration.toLocaleString()} ms`} />)
                : (<></>)}
            {
                props.group.items?.map(renderGroupItem)
            }
        </Box>
    )
}

const RequestResult = (props: { result: WorkbookExecutionRequestResult, sx: SxProps }) => {
    let idx = 0
    return (<Box sx={props.sx}>
        <Box sx={{ marginBottom: '1rem' }}>
            {((props.result.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${props.result.errorMessage}`} />)}
            {props.result.response
                ? (<TestInfo text={`Status: ${props.result.response.status} ${props.result.response.statusText}`} />)
                : (<></>)}
            <TestInfo text={`Executed At: ${props.result.executedAt > 0 ? `${fmtMinSec(props.result.executedAt)}` : '(Start)'}`} />
            {(props.result.duration && props.result.duration > 0)
                ? (<TestInfo text={`Duration: ${props.result.duration.toLocaleString()} ms`} />)
                : (<></>)}
            {/* {props.tokenCached
                ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
                : (<></>)} */}
        </Box>
        {
            props.result.tests?.results
                ? (props.result.tests?.results.map(test => (<TestResult
                    key={`test-${idx++}`}
                    name={test.testName}
                    success={test.success}
                    error={test.error}
                    logs={test.logs} />)))
                : (<></>)
        }
    </Box>)
}

const TestInfo = (props: { isError?: boolean, text: string }) =>
(
    <Stack direction='row'>
        <Stack direction='column' sx={{ marginLeft: '0rem' }}>
            <Box sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, color: '#80000' }}>
                {
                    props.isError === true
                        ? (<Box color='#FF0000' sx={{ ":first-letter": { textTransform: 'capitalize' }, whiteSpace: 'pre-wrap' }}>{props.text}</Box>)
                        : (<>{props.text}</>)
                }
            </Box>
        </Stack>
    </Stack>
)

const TestResult = (props: { name: string[], success: boolean, logs?: string[], error?: string }) =>
(
    <Stack direction='row'>
        <Box sx={{ width: '1.5rem', marginRight: '0.5rem' }}>
            {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
        </Box>
        <Stack direction='column' width='98%'>
            <Typography sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }} component='div'>
                {props.name.join(' ')}
            </Typography>
            {(props.error?.length ?? 0) > 0 ? (<Typography
                sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize' } }} color='error'>{props.error}</Typography>) : (<></>)}
            {(props.logs?.length ?? 0) > 0 ? (
                <Box sx={{ marginTop: '0.25rem', marginBottom: 0 }}>
                    <pre className='log'>{props.logs?.join('\n')}</pre>
                </Box>
            ) : (<></>)}
        </Stack>
    </Stack>
)

export const ResultInfoViewer = observer((props: { requestOrGroupId: string, index: number }) => {
    const workspace = useWorkspace()
    const clipboardCtx = useClipboard()

    let title: string | null = null
    let group: WorkbookExecutionGroupResult | null = null
    let request: WorkbookExecutionRequestResult | null = null

    const result = workspace.getExecutionResult(props.requestOrGroupId, props.index)

    if (result?.type === 'group') {
        group = result
        title = `Group Execution ${group.requestsWithFailedTestsCount === 0 && group.requestsWithErrors === 0 ? "Completed" : "Failed"}`
    } else if (result?.type === 'request') {
        request = result
        title = `Request Execution ${result.success ? "Completed" : "Failed"}`
    } else {
        return null
    }


    const copyToClipboard = (data: any) => {
        const text = beautify.js_beautify(JSON.stringify(data), {})
        clipboardCtx.writeTextToClipboard(text)
    }

    return (
        <Stack sx={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '100%', overflow: 'hidden', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>
                {title}
                <IconButton
                    aria-label="copy results to clipboard"
                    title="Copy Results to Clipboard"
                    sx={{ marginLeft: '1rem' }}
                    onClick={_ => copyToClipboard(result)}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            {(
                request ? <RequestResult result={request} sx={{ overflow: 'auto', bottom: 0, position: 'relative' }} /> : null
            )}
            {(
                group ? <GroupResult group={group} sx={{ overflow: 'auto', bottom: 0, position: 'relative' }} /> : null
            )}

        </Stack >
    )
})
