import { Box, Stack, SxProps } from "@mui/system"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { WorkbookExecutionGroupSummary, WorkbookExecutionResult } from "../../../models/workbook/workbook-execution";
import { observer } from "mobx-react-lite";
import { EditableEntityType } from "../../../models/workbook/editable-entity-type";
import { EditableWorkbookRequest, EditableWorkbookRequestGroup } from "../../../models/workbook/editable-workbook-request";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";

const ResultSummary = (props: { sx: SxProps, summary: WorkbookExecutionGroupSummary }) => {
    let idx = 0
    return (
        <Box key={`test-summary-${idx++}`} sx={props.sx}>
            {
                props.summary.requests?.map(request => {
                    const subtitleParts: string[] = []
                    if (request.status) {
                        subtitleParts.push(`${request.status} ${request.statusText}`)
                    }
                    subtitleParts.push(`${request.milliseconds.toLocaleString()} ms`)
                    const title = `${request.requestName} (${subtitleParts.join(', ')})`
                    return (
                        <Box key={`test-summary-${idx++}`}>
                            <Typography sx={{ marginTop: '0.5rem', marginBottom: '0.25rem', paddingTop: 0, color: '#80000' }} component='div'>
                                {title}
                            </Typography>
                            {
                                request.errorMessage
                                    ? (<TestInfo isError={true} text={`${request.errorMessage}`} />)
                                    : null
                            }
                            {
                                request.tests
                                    ? (
                                        <Box>
                                            {
                                                request.tests.map(test => (<TestResult
                                                    key={`test-${idx++}`}
                                                    name={test.testName}
                                                    success={test.success}
                                                    error={test.error}
                                                    logs={test.logs} />))
                                            }
                                        </Box>
                                    )
                                    : null
                            }
                        </Box>
                    )
                })
            }
        </Box>
    )
}

const ResultDetail = (props: { result: WorkbookExecutionResult, sx: SxProps }) => {
    let idx = 0
    const executedAt = props.result.executedAt > 0 ? `${props.result.executedAt.toLocaleString()}` : '(Start)'
    return (<Box sx={props.sx}>
        <Box sx={{ marginBottom: '1rem' }}>
            {((props.result.errorMessage?.length ?? 0) == 0)
                ? (<></>)
                : (<TestInfo isError={true} text={`${props.result.errorMessage}`} />)}
            {props.result.response
                ? (<TestInfo text={`Status: ${props.result.response.status} ${props.result.response.statusText}`} />)
                : (<></>)}
            <TestInfo text={`Executed At: ${executedAt}`} />
            {(props.result.milliseconds && props.result.milliseconds > 0)
                ? (<TestInfo text={`Duration: ${props.result.milliseconds.toLocaleString()} ms`} />)
                : (<></>)}
            {/* {props.tokenCached
                ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
                : (<></>)} */}
        </Box>
        {
            props.result.tests
                ? (props.result.tests.map(test => (<TestResult
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
        <Stack direction='column'>
            <Typography sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }} component='div'>
                {props.name.join(' ')}
            </Typography>
            {(props.error?.length ?? 0) > 0 ? (<Typography
                sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize' } }} color='error'>{props.error}</Typography>) : (<></>)}
            {(props.logs?.length ?? 0) > 0 ? (
                <Box sx={{ overflow: 'auto', marginTop: '0.25rem', marginBottom: 0 }}>
                    <pre style={{ paddingTop: 0, marginTop: 0, whiteSpace: 'pre-line' }}>{props.logs?.join('\n')}</pre>
                </Box>
            ) : (<></>)}
        </Stack>
    </Stack>
)

export const ResultInfoViewer = observer((props: {
    requestOrGroupId: string, runIndex: number, resultIndex: number
 }) => {
    const workspace = useWorkspace()
    const clipboardCtx = useClipboard()
    
    const request = workspace.active?.entityType === EditableEntityType.Request
        ? workspace.active as EditableWorkbookRequest
        : null


    const group = workspace.active?.entityType === EditableEntityType.Group
        ? workspace.active as EditableWorkbookRequestGroup
        : null

    if (! (request || group)) {
        return null
    }

    const copyToClipboard = (data: any) => {
        const text = beautify.js_beautify(JSON.stringify(data), {})
        clipboardCtx.writeTextToClipboard(text)
    }

    let summary: WorkbookExecutionGroupSummary | undefined
    let result: WorkbookExecutionResult | undefined
    let title: string | null = null

    if ((group && props.resultIndex === -1)) {
        summary = workspace.getExecutionGroupSummary(props.requestOrGroupId, props.runIndex)
        if (summary) {
            title = `Group Execution ${summary.allTestsSucceeded ? "Completed" : "Failed"}`
            if (summary.milliseconds) {
                title += ` (${summary.milliseconds} ms)`
            }
        }
        result = undefined
    } else {
        result = workspace.getExecutionResult(props.requestOrGroupId, props.runIndex, props.resultIndex)
        if (result) {
            title = `Request Execution ${result.success ? "Completed" : "Failed"}`
        }
    }

    if (!title || (!(result || summary))) {
        return null
    }

    return (
        <Stack sx={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '100%', overflow: 'hidden', display: 'flex' }}>
            <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>
                {title}
                <IconButton
                    aria-label="copy results to clipboard"
                    title="Copy Results to Clipboard"
                    sx={{ marginLeft: '1rem' }}
                    onClick={_ => copyToClipboard(result ?? summary)}>
                    <ContentCopyIcon />
                </IconButton>
            </Typography>
            {(
                result ? <ResultDetail result={result} sx={{ overflow: 'auto', bottom: 0, position: 'relative' }}  /> : null
            )}
            {(
                summary ? <ResultSummary summary={summary} sx={{ overflow: 'auto', bottom: 0, position: 'relative' }} /> : null
            )}

        </Stack >
    )
})
