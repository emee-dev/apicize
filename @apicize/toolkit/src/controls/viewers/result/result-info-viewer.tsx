import { Box, Stack, SxProps } from "@mui/material"
import { IconButton, Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check';
import BlockIcon from '@mui/icons-material/Block';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import beautify from "js-beautify";
import { observer } from "mobx-react-lite";
import { useClipboard } from "../../../contexts/clipboard.context";
import { useWorkspace } from "../../../contexts/workspace.context";
import { ApicizeError } from "@apicize/lib-typescript";
import { ExecutionResult } from "../../../models/workspace/execution";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { useEffect, useState } from "react";

const ApicizeErrorToString = (error?: ApicizeError): string => {
    const sub = (err?: ApicizeError) => err ? `, ${err.description}${ApicizeErrorToString(err.source)}` : '';
    return error ? `[${error.type}] ${error.description}${sub(error.source)}` : ''
}

export const ResultInfoViewer = observer((props: { requestOrGroupId: string, index: number }) => {

    const workspace = useWorkspace()
    const clipboardCtx = useClipboard()
    const requestOrGroupId = props.requestOrGroupId

    const mainResult = workspace.getExecutionResult(props.requestOrGroupId, props.index)
    if (!mainResult) return null

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

    const RenderResult = (props: { result: ExecutionResult }) => {
        if (props.result.execution) {
            return <RenderExecution key={`result-${idx++}`} result={props.result} />
        } else {
            return <RenderSummary key={`result-${idx++}`} result={props.result} />
        }
    }

    const RenderExecution = (props: { result: ExecutionResult }) => {
        const rowSuffix = props.result.info.rowNumber && props.result.info.rowCount ? ` Row ${props.result.info.rowNumber} of ${props.result.info.rowCount}` : ''
        const subtitle = `${(props.result.info.runCount ?? 1) > 1 ? `Run ${props.result.info.runNumber} of ${props.result.info.runCount}` : ''}${props.result.success ? "Completed" : "Failed"}`
        const color = props.result.success ? 'success' : ((props.result.requestErrorCount ?? 0) > 0 || props.result?.execution?.error) ? 'error' : 'warning'

        let key: string
        if (props.result === mainResult) {
            key = 'first-result'
        } else {
            key = `tree-${idx++}`;
        }

        return <TreeItem itemId={key} key={key} label={<Box>{props.result.info.title}{rowSuffix}
            <Typography display='inline' margin={'0 0.8em'} color={color}>({subtitle})</Typography>
            {props.result.executedAt > 0 ? `@${fmtMinSec(props.result.executedAt)}` : '@Start'}{props.result.duration > 0 ? ` for ${props.result.duration.toLocaleString()} ms` : ''}
        </Box>}>
            {(props.result.execution?.error)
                ? (<TestInfo isError={true} text={`${ApicizeErrorToString(props.result.execution.error)}`} />)
                : (<></>)}
            {props.result.execution?.response
                ? (<TestInfo text={`Status: ${props.result.execution.response.status} ${props.result.execution.response.statusText}`} />)
                : (<></>)}
            {
                (props.result.execution?.tests && props.result.execution.tests.length > 0)
                    ? <Box className='test-details'>
                        {
                            props.result.execution.tests.map(test => (<TestResult
                                key={`test-${idx++}`}
                                name={test.testName}
                                success={test.success}
                                error={test.error}
                                logs={test.logs} />))
                        }
                    </Box>
                    : (<></>)
            }
            {
                (props.result.info.childIndexes ?? []).map(childIndex => {
                    const child = workspace.getExecutionResult(requestOrGroupId, childIndex)
                    if (child) {
                        if (child.execution) {
                            return <RenderExecution key={`result-${idx++}`} result={child} />
                        } else {
                            return <RenderSummary key={`result-${idx++}`} result={child} />
                        }
                    } else {
                        return <></>
                    }
                })
            }


        </TreeItem>

        {/* //     
        //     {/* {props.tokenCached
        //             ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
        //             : (<></>)} */}


    }


    const RenderSummary = (props: { result: ExecutionResult }) => {
        let key: string
        if (props.result === mainResult) {
            key = 'first-result'
        } else {
            key = `tree-${idx++}`;
        }

        const childIndexes = props.result.info?.childIndexes ?? []
        const subtitle = `${(props.result.info?.runCount ?? 0) > 1 ? `Run ${props.result.info.runNumber} of ${props.result.info.runCount}, ` : ''}${props.result.success ? "Completed" : "Failed"}`
        let color = props.result.success ? 'success' : ((props.result.requestErrorCount ?? 0) > 0 || props.result?.execution?.error) ? 'error' : 'warning'

        return <TreeItem key={key} itemId={key} label={
            <Box>{props.result.info.title}
                <Typography display='inline' margin='0 0.8em' color={color}>({subtitle})</Typography>
                {props.result.executedAt > 0 ? `@${fmtMinSec(props.result.executedAt)}` : '@Start'}{props.result.duration > 0 ? ` for ${props.result.duration.toLocaleString()} ms` : ''}
            </Box>
        }>
            {
                childIndexes.map(childIndex => {
                    const child = workspace.getExecutionResult(requestOrGroupId, childIndex)
                    if (child) {
                        if (child.execution) {
                            return <RenderExecution key={`result-${idx++}`} result={child} />
                        } else {
                            return <RenderSummary key={`result-${idx++}`} result={child} />
                        }
                    } else {
                        return <></>
                    }
                })
            }
        </TreeItem>
    }

    const TestInfo = (props: { isError?: boolean, text: string }) => {
        const key = `tree-${idx++}`;
        return <TreeItem key={key} itemId={key} label={
            props.isError === true
                ? (<Box color='#f44336' sx={{ ":first-letter": { textTransform: 'capitalize' }, whiteSpace: 'pre-wrap' }}>{props.text}</Box>)
                : (<>{props.text}</>)
        } />
    }

    const TestResult = (props: { name: string[], success: boolean, logs?: string[], error?: string }) => {
        const key = `tree-${idx++}`;
        const error = (props.error && props.error.length > 0) ? props.error : null
        const logs = (props.logs?.length ?? 0) > 0 ? props.logs : null

        return (error || logs)
            ? <TreeItem key={key} itemId={key} className='test-result' label={
                <Stack direction='row'>
                    <Box sx={{ width: '2.0rem' }}>
                        {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
                    </Box>
                    <Box>
                        {props.name.join(' ')}
                    </Box>
                </Stack>}>

                {
                    (props.error?.length ?? 0) > 0
                        ?
                        <TreeItem itemId={`tree-${idx++}`} className='test-result' label={
                            <Stack direction='row'>
                                <Box sx={{ width: '2.0rem' }} />
                                <Typography sx={{ left: '-24px', marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize' } }} color='error'>{props.error}</Typography>
                            </Stack>
                        } />
                        : <></>
                }
                {
                    (props.logs ?? []).map((log) => (
                        <TreeItem itemId={`tree-${idx++}`} className='test-result' label={
                            <Stack direction='row' left='-24px'>
                                <Box sx={{ width: '2.0rem' }} />
                                <pre className='log'>{log}</pre>
                            </Stack>
                        } />)
                    )
                }
            </TreeItem>
            : <TreeItem key={key} itemId={key} className='test-result' label={
                <Stack direction='row'>
                    <Box sx={{ width: '1.5rem', marginRight: '0.5rem' }}>
                        {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
                    </Box>
                    <Box>
                        <Typography sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }} component='div'>
                            {props.name.join(' ')}
                        </Typography>
                    </Box>
                </Stack>} />

    }

    const [expanded, setExpanded] = useState<string[]>(['first-result']);
    // useEffect(() => {
    //     setExpanded([...Array(idx).keys()].map(i => `tree-${i}`));
    // }, [expanded])


    // if (result?.type === 'group') {
    //     title = `Group Execution ${result.requestsWithFailedTestsCount === 0 && result.requestsWithErrors === 0 ? "Completed" : "Failed"}`
    // } else if (result?.type === 'request') {
    //     title = `Request Execution ${result.success ? "Completed" : "Failed"}`
    // } else {
    //     return null
    // }

    const copyToClipboard = (data: any) => {
        const text = beautify.js_beautify(JSON.stringify(data), {})
        clipboardCtx.writeTextToClipboard(text)
    }

    return <Stack className="results-info" sx={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '100%', overflow: 'hidden', display: 'flex' }}>
        {/* <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>
            {title}
            <IconButton
                aria-label="copy results to clipboard"
                title="Copy Results to Clipboard"
                sx={{ marginLeft: '1rem' }}
                color='primary'
                onClick={_ => copyToClipboard(result)}>
                <ContentCopyIcon />
            </IconButton>
        </Typography> */}
        <Box sx={{ overflow: 'auto', bottom: 0, paddingRight: '24px', position: 'relative' }}>
            <SimpleTreeView expandedItems={expanded} onExpandedItemsChange={(_, updated) => {
                setExpanded(updated)
            }}>
                <RenderResult result={mainResult} />
            </SimpleTreeView>
        </Box>
    </Stack>

})
