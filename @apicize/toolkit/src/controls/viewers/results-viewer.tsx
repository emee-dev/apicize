import { Box, Stack, SvgIcon, SvgIconPropsColorOverrides, SxProps, Theme, ToggleButton, ToggleButtonGroup } from "@mui/material"
import ScienceIcon from '@mui/icons-material/ScienceOutlined'
import { OverridableStringUnion } from '@mui/types';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import PreviewIcon from '@mui/icons-material/Preview'
import React from "react"
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markup'
// import 'prismjs/themes/prism-tomorrow.css''
import { ResultResponsePreview } from "./result/response-preview-viewer";
import { ResultRawPreview } from "./result/response-raw-viewer";
import { ResultInfoViewer } from "./result/result-info-viewer";
import { ResponseHeadersViewer } from "./result/response-headers-viewer";
import { ResultDetailsViewer } from "./result/result-details-viewer";
import { observer } from 'mobx-react-lite';
import { ResultsPanel, useWorkspace } from "../../contexts/workspace.context";
// import { MAX_TEXT_RENDER_LENGTH } from "./text-viewer";
import RequestIcon from "../../icons/request-icon";
import { toJS } from "mobx";

export const MAX_TEXT_RENDER_LENGTH = 64 * 1024 * 1024

export const ResultsViewer = observer((props: {
    sx?: SxProps<Theme>,
    requestOrGroupId: string,
    className?: string,
}) => {
    const workspace = useWorkspace()
    const requestOrGroupId = props.requestOrGroupId

    const requestExecution = workspace.executions.get(requestOrGroupId)

    if (!(requestExecution && requestExecution.results.length > 0)) {
        return null
    }

    const selectedExecution = requestExecution.resultMenu[requestExecution.resultIndex]
    const executionIndex = selectedExecution?.index
    const result = requestExecution.results[executionIndex]

    if (!result) {
        return null
    }

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: ResultsPanel) => {
        if (newValue) {
            workspace.changeResultsPanel(requestOrGroupId, newValue)
        }
    }

    let longTextInResponse: boolean
    let disableOtherPanels: boolean


    if (result.response) {
        disableOtherPanels = false
        longTextInResponse = (result.response.body?.type === 'Text' ? result.response.body.data.length : 0) > MAX_TEXT_RENDER_LENGTH

    } else {
        disableOtherPanels = true
        longTextInResponse = false

    }

    let panel = requestExecution?.panel
    if (disableOtherPanels && panel !== 'Info' && panel !== 'Details') {
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

    if (result.success) {
        infoColor = 'success'
    } else if (result.error || (result.requestErrorCount ?? 0) > 0) {
        infoColor = 'error'
    } else {
        infoColor = 'warning'
    }


    return requestExecution ? (
        <Stack direction={'row'} sx={props.sx} className={props.className}>
            <ToggleButtonGroup
                className='button-column'
                orientation='vertical'
                exclusive
                onChange={handlePanelChanged}
                value={panel}
                sx={{ marginRight: '12px' }}
                aria-label="text alignment">
                <ToggleButton value="Info" title="Show Result Info" aria-label='show info' size='small'><ScienceIcon color={infoColor ?? 'disabled'} /></ToggleButton>
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' size='small' disabled={disableOtherPanels}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' size='small' disabled={disableOtherPanels}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disableOtherPanels || longTextInResponse} size='small'><PreviewIcon /></ToggleButton>
                <ToggleButton value="Details" title="Show Details" aria-label='show details' size='small'><SvgIcon><RequestIcon /></SvgIcon></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ overflow: 'hidden', flexGrow: 1, bottom: '0', position: 'relative' }}>
                <Box position='relative' width='100%' height='100%'>
                    {
                        panel === 'Info' ? <ResultInfoViewer result={result} />
                            : panel === 'Headers' ? <ResponseHeadersViewer result={result} />
                                : panel === 'Preview' ? <ResultResponsePreview result={result} />
                                    : panel === 'Text' ? <ResultRawPreview result={result} />
                                        : panel === 'Details' ? <ResultDetailsViewer result={result} />
                                            : null
                    }
                </Box>
            </Box>
        </Stack>)
        : null
})

