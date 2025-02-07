import { Box, Stack, SxProps } from "@mui/system"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { ExecutionGroup, ExecutionRequest, ExecutionResult } from "../../../models/workspace/execution";
import { observer } from "mobx-react-lite";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";
import { ApicizeError } from "@apicize/lib-typescript";

const ApicizeErrorToString = (error?: ApicizeError): string => {
    const sub = (err?: ApicizeError) => err ? `, ${err.description}${ApicizeErrorToString(err.source)}` : '';
    return error ? `[${error.type}] ${error.description}${sub(error.source)}` : ''
}

export const ResultInfoViewer = observer((props: { requestOrGroupId: string, executionResultId: string }) => {

    const workspace = useWorkspace()
    const clipboardCtx = useClipboard()
    const requestOrGroupId = props.requestOrGroupId

    let idx = 0

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

    const RenderResult = (props: { result: ExecutionResult, level: number, sx?: SxProps }) => {
        switch (props.result.type) {
            case 'request':
                return <RenderRequest result={props.result} level={props.level} sx={props.sx} />
            case 'group':
                return <RenderGroup result={props.result} level={props.level} sx={props.sx} />
        }
    }

    const RenderRequest = (props: { result: ExecutionRequest, level: number, sx?: SxProps }) => {
        let showName
        let level
        if (props.level === -1) {
            showName = false
            level = 0
        } else {
            showName = true
            level = props.level
        }
        const indent = `${level * 2}em`
        const subtitle = `${props.result.numberOfRuns > 1 ? `Run ${props.result.runNumber} of ${props.result.numberOfRuns}, ` : ''}${props.result.success ? "Completed" : "Failed"}`
        const color = props.result.success ? 'success' : props.result.requestsWithErrors ? 'error' : 'warning'
        return <Box key={`result-${idx++}`} paddingLeft={indent} sx={props.sx}>
            {showName
                ? <Typography variant="h3" sx={{ marginTop: '1em' }} component='div'>{props.result.name}<Typography fontSize='1em' display='inline' marginLeft='0.8em' color={color}>({subtitle})</Typography></Typography>
                : null}

            {(props.result.error)
                ? (<TestInfo isError={true} text={`${ApicizeErrorToString(props.result.error)}`} />)
                : (<></>)}
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

            {
                (props.result.tests && props.result.tests?.length > 0)
                    ? <Box className='test-details'>
                        {
                            props.result.tests.map(test => (<TestResult
                                key={`test-${idx++}`}
                                name={test.testName}
                                success={test.success}
                                error={test.error}
                                logs={test.logs} />))
                        }
                    </Box>
                    : (<></>)
            }
        </Box>
    }


    const RenderGroup = (props: { result: ExecutionGroup, level: number, sx?: SxProps }) => {
        let showName
        let level
        if (props.level === -1) {
            showName = false
            level = 0
        } else {
            showName = true
            level = props.level
        }
        const indent = `${level * 2}em`
        const subtitle = `${props.result.numberOfRuns > 1 ? `Run ${props.result.runNumber} of ${props.result.numberOfRuns}, ` : ''}${props.result.success ? "Completed" : "Failed"}`
        const color = props.result.success ? 'success' : props.result.requestsWithErrors ? 'error' : 'warning'
        return <Box key={`result-${idx++}`} paddingLeft={indent} sx={props.sx}>
            {showName
                ? <Typography variant="h3" sx={{ marginTop: '1em' }} component='div'>{props.result.name}<Box display='inline-block' color={color} marginLeft='1em'>({subtitle})</Box></Typography>
                : null}

            <TestInfo text={`Executed At: ${props.result.executedAt > 0 ? `${fmtMinSec(props.result.executedAt)}` : '(Start)'}`} />
            {(props.result.duration && props.result.duration > 0)
                ? (<TestInfo text={`Duration: ${props.result.duration.toLocaleString()} ms`} />)
                : (<></>)}
            <>
                {
                    props.result.childExecutionIDs?.map(childExecutionID => {
                        const child = workspace.getExecutionResult(requestOrGroupId, childExecutionID)
                        switch (child?.type) {
                            case 'request':
                                return <RenderRequest key={`result-${idx++}`} result={child} level={level} />
                            case 'group':
                                return <RenderGroup key={`result-${idx++}`} result={child} level={level + 1} />
                            default:
                                <></>
                        }
                    })
                }
            </>
        </Box>
    }

    const TestInfo = (props: { isError?: boolean, text: string }) =>
    (
        <Stack direction='row'>
            <Stack direction='column' sx={{ marginLeft: '0rem' }}>
                <Box sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, color: '#80000' }}>
                    {
                        props.isError === true
                            ? (<Box color='#f44336' sx={{ ":first-letter": { textTransform: 'capitalize' }, whiteSpace: 'pre-wrap' }}>{props.text}</Box>)
                            : (<>{props.text}</>)
                    }
                </Box>
            </Stack>
        </Stack>
    )

    const TestResult = (props: { name: string[], success: boolean, logs?: string[], error?: string }) =>
    (
        <Stack direction='row' className='test-result'>
            <Box sx={{ width: '1.5rem', marginRight: '0.5rem' }}>
                {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
            </Box>
            <Stack direction='column' width='98%'>
                <Typography sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }} component='div'>
                    {props.name.join(' ')}
                </Typography>
                {(props.error?.length ?? 0) > 0 ? (<Typography
                    sx={{ marginTop: '0.25rem', marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize' } }} color='error'>{props.error}</Typography>) : (<></>)}
                {(props.logs?.length ?? 0) > 0 ? (
                    <Box sx={{ marginTop: '0.25rem', marginBottom: 0 }}>
                        <pre className='log'>{props.logs?.join('\n')}</pre>
                    </Box>
                ) : (<></>)}
            </Stack>
        </Stack>
    )

    let title: string | null = null

    const result = workspace.getExecutionResult(props.requestOrGroupId, props.executionResultId)
    const response = workspace.getExecutionResposne(props.requestOrGroupId)

    if (result?.type === 'group') {
        title = `Group Execution ${result.requestsWithFailedTestsCount === 0 && result.requestsWithErrors === 0 ? "Completed" : "Failed"}`
    } else if (result?.type === 'request') {
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
                    onClick={_ => copyToClipboard(response)}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            <RenderResult result={result} level={-1} sx={{ overflow: 'auto', bottom: 0, paddingRight: '24px', position: 'relative' }} />
        </Stack >
    )
})
