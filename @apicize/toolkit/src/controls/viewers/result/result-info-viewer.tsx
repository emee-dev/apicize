import { Box, Grid2, IconButton, Link, Stack, SvgIcon, useTheme } from "@mui/material"
import { Typography } from "@mui/material"
import CheckIcon from '@mui/icons-material/Check'
import BlockIcon from '@mui/icons-material/Block'
import { observer } from "mobx-react-lite"
import { useClipboard } from "../../../contexts/clipboard.context"
import { useWorkspace } from "../../../contexts/workspace.context"
import { ApicizeError, ExecutionResultSuccess, ExecutionResultSummary } from "@apicize/lib-typescript"
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import React, { useState } from "react"
import ViewIcon from "../../../icons/view-icon"
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { ToastSeverity, useFeedback } from "../../../contexts/feedback.context"
import beautify from "js-beautify"

const ApicizeErrorToString = (error?: ApicizeError): string => {
    const sub = (err?: ApicizeError) => err ? `, ${err.description}${ApicizeErrorToString(err.source)}` : ''
    return error ? `[${error.type}] ${error.description}${sub(error.source)}` : ''
}

export const ResultInfoViewer = observer((props: { requestOrGroupId: string, resultIndex: number, results: ExecutionResultSummary[] }) => {
    const workspace = useWorkspace()
    const theme = useTheme()
    const clipboardCtx = useClipboard()
    const feedback = useFeedback()

    const requestOrGroupId = props.requestOrGroupId
    const mainResultIndex = props.resultIndex
    const mainResult = props.results[mainResultIndex]

    let idx = 0
    let summaries: Map<number, ExecutionResultSummary>

    if (!mainResult) {
        return null
    }

    try {
        summaries = retrieveSummariesForIndex(props.results, mainResultIndex)
    } catch (e) {
        feedback.toastError(e)
        return null
    }

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

    const RenderExecution = (props: { childResult: ExecutionResultSummary, first?: boolean }) => {
        // const rowSuffix = props.result.info.rowNumber && props.result.info.rowCount ? ` Row ${props.result.info.rowNumber} of ${props.result.info.rowCount}` : ''
        let subtitle: string
        let color: string

        switch (props.childResult.success) {
            case ExecutionResultSuccess.Error:
                subtitle = 'Error'
                color = theme.palette.error.main
                break
            case ExecutionResultSuccess.Failure:
                subtitle = 'Failure'
                color = theme.palette.warning.main
                break
            default:
                subtitle = 'Success'
                color = theme.palette.success.main
                break
        }

        const isFirst = props.childResult.index === mainResultIndex
        const key = isFirst ? 'first-result' : `tree-${idx++}`

        return <TreeItem itemId={key} key={key} label={
            <Grid2 container direction='row' display='flex' alignItems='center' margin='0.5rem 0 0.5rem 0.5rem'>
                <Grid2 display='flex' flexDirection='column' alignItems='start' alignContent='center' flexGrow='content'>
                    <Box display='flex' fontSize={props.first ? '1.1rem' : 'inherit'}>
                        <Box sx={{ whiteSpace: 'nowrap' }}>
                            {props.childResult.name}
                            <Box component='span' marginLeft='1rem' marginRight='0.5em' sx={{ color }}> ({subtitle}) </Box>
                        </Box>
                    </Box>
                    <Box display='flex' alignContent='start' marginLeft='1.5em' fontSize='0.9em'>
                        {props.childResult.executedAt > 0 ? `@${fmtMinSec(props.childResult.executedAt)}` : '@Start'}{props.childResult.duration > 0 ? ` for ${props.childResult.duration.toLocaleString()} ms` : ''}
                    </Box>
                </Grid2>
                <Grid2 display='flex' flexBasis='content' alignItems='center' alignContent='start' marginLeft='1.0rem'>
                    <IconButton
                        title="Copy Data to Clipboard"
                        color='primary'
                        onClick={e => copyToClipboard(e, props.childResult.index)}>
                        <ContentCopyIcon />
                    </IconButton>
                    {
                        isFirst
                            ? <></>
                            : <Link title='View Details' underline='hover' display='inline-flex' marginLeft='0.5rem' alignItems='center' onClick={e => changeResult(e, props.childResult.index)}><SvgIcon><ViewIcon /></SvgIcon></Link>
                    }
                </Grid2>
            </Grid2 >
        }>

            {(props.childResult.error)
                ? (<TestInfo isError={true} text={`${ApicizeErrorToString(props.childResult.error)}`} />)
                : (<></>)}
            {
                props.childResult.status
                    ? (<TestInfo text={`Status: ${props.childResult.status} ${props.childResult.statusText}`} />)
                    : (<></>)
            }
            {
                (props.childResult.testResults && props.childResult.testResults.length > 0)
                    ? <Box className='test-details'>
                        {
                            props.childResult.testResults.map(test => (<TestResult
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
                (props.childResult.childIndexes ?? []).map(childIndex => {
                    const child = summaries.get(childIndex)
                    return child ? <RenderExecution key={`result-${idx++}`} childResult={child} /> : null
                })
            }
        </TreeItem >

        {/* //     
        //     {/* {props.tokenCached
        //             ? (<TestInfo text='OAuth bearer token retrieved from cache' />)
        //             : (<></>)} */}

    }

    const TestInfo = (props: { isError?: boolean, text: string }) => {
        const key = `tree-${idx++}`
        return <TreeItem key={key} itemId={key} label={
            props.isError === true
                ? (<Box color='#f44336' sx={{ ":first-letter": { textTransform: 'capitalize' }, whiteSpace: 'pre-wrap' }}>{props.text}</Box>)
                : (<>{props.text}</>)
        } />
    }

    const TestResult = (props: { name: string[], success: boolean, logs?: string[], error?: string }) => {
        const key = `tree-${idx++}`
        const error = (props.error && props.error.length > 0) ? props.error : null
        const logs = (props.logs?.length ?? 0) > 0 ? props.logs : null

        return (error || logs)
            ? <TreeItem key={key} itemId={key} className='test-result' label={
                <Stack direction='row' key={`tree-${idx++}`}>
                    <Box sx={{ width: '2.0rem' }} key={`tree-${idx++}`}>
                        {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
                    </Box>
                    <Box key={`tree-${idx++}`}>
                        {props.name.join(' ')}
                    </Box>
                </Stack>}>
                {
                    (props.error?.length ?? 0) > 0
                        ?
                        <TreeItem itemId={`tree-${idx++}`} className='test-result' key={`tree-${idx++}`} label={
                            <Stack direction='row' key={`tree-${idx++}`}>
                                <Box sx={{ width: '2.0rem' }} key={`tree-${idx++}`} />
                                <Typography key={`tree-${idx++}`} sx={{ left: '-24px', marginBottom: 0, paddingTop: 0, ":first-letter": { textTransform: 'capitalize' } }} color='error'>{props.error}</Typography>
                            </Stack>
                        } />
                        : <></>
                }
                {
                    (props.logs ?? []).map((log) => (
                        <TreeItem itemId={`tree-${idx++}`} className='test-result' key={`tree-${idx++}`} label={
                            <Stack direction='row' left='-24px' key={`tree-${idx++}`}>
                                <Box sx={{ width: '2.0rem' }} key={`tree-${idx++}`} />
                                <pre className='log' key={`tree-${idx++}`}>{log}</pre>
                            </Stack>
                        } />)
                    )
                }
            </TreeItem>
            : <TreeItem key={key} itemId={key} className='test-result' label={
                <Stack direction='row' key={`tree-${idx++}`}>
                    <Box sx={{ width: '1.5rem', marginRight: '0.5rem' }} key={`tree-${idx++}`}>
                        {props.success ? (<CheckIcon color='success' />) : (<BlockIcon color='error' />)}
                    </Box>
                    <Box key={`tree-${idx++}`}>
                        <Typography sx={{ marginTop: 0, marginBottom: 0, paddingTop: 0 }} component='div' key={`tree-${idx++}`}>
                            {props.name.join(' ')}
                        </Typography>
                    </Box>
                </Stack>} />

    }

    const [expanded, setExpanded] = useState<string[]>(['first-result'])
    // useEffect(() => {
    //     setExpanded([...Array(idx).keys()].map(i => `tree-${i}`))
    // }, [expanded])


    // if (result?.type === 'group') {
    //     title = `Group Execution ${result.requestsWithFailedTestsCount === 0 && result.requestsWithErrors === 0 ? "Completed" : "Failed"}`
    // } else if (result?.type === 'request') {
    //     title = `Request Execution ${result.success ? "Completed" : "Failed"}`
    // } else {
    //     return null
    // }

    const changeResult = (e: React.MouseEvent, index: number) => {
        e.preventDefault()
        e.stopPropagation()
        workspace.getExecution(requestOrGroupId)?.changeResultIndex(index)

    }

    const copyToClipboard = (e: React.MouseEvent, index: number) => {
        try {
            e.preventDefault()
            e.stopPropagation()
            const payload = props.results[index]
            if (payload) {
                clipboardCtx.writeTextToClipboard(
                    beautify.js_beautify(JSON.stringify(payload), {})
                )
                feedback.toast('Data copied to clipboard', ToastSeverity.Success)
            }
        } catch (e) {
            feedback.toast(`${e}`, ToastSeverity.Error)
        }
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
                <RenderExecution childResult={mainResult} first={true} />
            </SimpleTreeView>
        </Box>
    </Stack>
})

function retrieveSummariesForIndex(summaries: ExecutionResultSummary[], index: number) {
    const results = new Map<number, ExecutionResultSummary>()

    const appendIndex = (indexToAppend: number) => {
        if (indexToAppend < 0 || indexToAppend >= summaries.length) {
            throw new Error(`Invalid result index ${indexToAppend}`)
        }
        const summary = summaries[indexToAppend]
        results.set(indexToAppend, summary)
        return summary
    }

    const appendChildren = (summary: ExecutionResultSummary) => {
        if (summary.childIndexes) {
            for (const childIndex of summary.childIndexes) {
                if (!results.has(childIndex)) {
                    const child = appendIndex(childIndex)
                    appendChildren(child)
                }
            }
        }
    }

    const main = appendIndex(index)
    if (main.parentIndex) {
        appendIndex(main.parentIndex)
    }

    appendChildren(main)
    return results
}