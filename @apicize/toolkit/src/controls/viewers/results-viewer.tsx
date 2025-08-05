import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import SvgIcon from '@mui/material/SvgIcon'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { SvgIconPropsColorOverrides, SxProps, Theme } from "@mui/material"
import { ScienceOutlinedIcon, ViewListOutlinedIcon, ArticleOutlinedIcon, PreviewIcon } from '../../icons'
import { OverridableStringUnion } from '@mui/types';
import React, { useMemo, useEffect } from "react"
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultDetailsViewer } from "./result/result-details-viewer";
import { observer } from 'mobx-react-lite';
import { ResultsPanel, useWorkspace } from "../../contexts/workspace.context";
// import { MAX_TEXT_RENDER_LENGTH } from "./text-viewer";
import RequestIcon from "../../icons/request-icon";
import { ExecutionResultSuccess } from "@apicize/lib-typescript";
import { EntityType } from '../../models/workspace/entity-type';

export const MAX_TEXT_RENDER_LENGTH = 64 * 1024 * 1024

export const ResultsViewer = observer((props: {
    sx?: SxProps<Theme>,
    className?: string,
    lastExecuted: number, // here just to force a refresh
}) => {
    const workspace = useWorkspace()

    const activeSelection = workspace.activeSelection
    if (!(activeSelection &&
        (activeSelection.type === EntityType.Request || activeSelection.type === EntityType.Group)
    )) {
        return null
    }

    const execution = workspace.getExecution(activeSelection.id)
    if (!execution) {
        return null
    }

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: ResultsPanel) => {
        if (newValue) {
            workspace.changeResultsPanel(execution.requestOrGroupId, newValue)
        }
    }

    const result = execution.results[execution.resultIndex]

    const panelStates = useMemo(() => {
        const disableHeadersPanel = !result.hasResponseHeaders
        const disableText = (!result.responseBodyLength) || (result.responseBodyLength === 0)
        const disablePreview = (!result.responseBodyLength) || (result.responseBodyLength === 0 || result.responseBodyLength > MAX_TEXT_RENDER_LENGTH)
        
        return { disableHeadersPanel, disableText, disablePreview }
    }, [result.hasResponseHeaders, result.responseBodyLength])

    const { disableHeadersPanel, disableText, disablePreview } = panelStates

    let panel = execution.panel

    if ((disableHeadersPanel && panel === 'Headers')
        || (disableText && panel === 'Text')
        || (disablePreview && panel === 'Preview')) {
        panel = 'Info'
    }

    let infoColor: OverridableStringUnion<
        | 'inherit'
        | 'action'
        | 'disabled'
        | 'primary'
        | 'secondary'
        | 'error'
        | 'info'
        | 'success'
        | 'warning'
        | 'private'
        | 'vault',
        SvgIconPropsColorOverrides
    > | undefined = undefined

    if (result.success === ExecutionResultSuccess.Success) {
        infoColor = 'success'
    } else if (result.success === ExecutionResultSuccess.Failure) {
        infoColor = 'warning'
    } else {
        infoColor = 'error'
    }

    return <Stack direction='row' sx={props.sx} className={props.className}>
        <ToggleButtonGroup
            className='button-column'
            orientation='vertical'
            exclusive
            onChange={handlePanelChanged}
            value={panel}
            sx={{ marginRight: '12px' }}
            aria-label="text alignment">
            <ToggleButton value="Info" title="Show Result Info" aria-label='show info' size='small'><ScienceOutlinedIcon color={infoColor ?? 'disabled'} /></ToggleButton>
            <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' size='small' disabled={disableHeadersPanel}><ViewListOutlinedIcon /></ToggleButton>
            <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' size='small' disabled={disableText}><ArticleOutlinedIcon /></ToggleButton>
            <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disablePreview} size='small'><PreviewIcon /></ToggleButton>
            <ToggleButton value="Details" title="Show Details" aria-label='show details' size='small'><SvgIcon><RequestIcon /></SvgIcon></ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ overflow: 'hidden', flexGrow: 1, bottom: '0', position: 'relative' }}>
            <Box position='relative' width='100%' height='100%'>
                {
                    panel === 'Info' ? <ResultInfoViewer requestOrGroupId={execution.requestOrGroupId} resultIndex={execution.resultIndex} results={execution.results} />
                        : panel === 'Headers' ? <ResponseHeadersViewer execution={execution} />
                            : panel === 'Text' ? <ResultRawPreview execution={execution} />
                                : panel === 'Preview' ? <ResultResponsePreview execution={execution} />
                                    : panel === 'Details' ? <ResultDetailsViewer execution={execution} />
                                        : null
                }
            </Box>
        </Box>
    </Stack>
})