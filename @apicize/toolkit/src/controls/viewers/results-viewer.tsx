import { Box, Stack, SvgIconPropsColorOverrides, SxProps, Theme, ToggleButton, ToggleButtonGroup } from "@mui/material"
import ScienceIcon from '@mui/icons-material/ScienceOutlined'
import SendIcon from '@mui/icons-material/Send';
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
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { useWorkspace } from "../../contexts/workspace.context";
import { WorkbookExecutionGroup, WorkbookExecutionRequest } from "../../models/workbook/workbook-execution";
import { MAX_TEXT_RENDER_LENGTH } from "./text-viewer";

export const ResultsViewer = observer((props: {
    sx?: SxProps<Theme>
}) => {
    const workspace = useWorkspace()

    if ((!workspace.active) ||
        (workspace.active.entityType !== EditableEntityType.Request
            && workspace.active.entityType !== EditableEntityType.Group)) {
        return null
    }

    const requestExecution = workspace.executions.get(workspace.active.id)
    if (!(requestExecution && requestExecution.results.size > 0)) {
        return null
    }

    const requestOrGroupId = workspace.active.id
    const selectedExecution = requestExecution.resultMenu[requestExecution.resultIndex]
    const executionResultId = selectedExecution?.executionResultId

    const executionResult = executionResultId ? workspace.getExecutionResult(workspace.active.id, executionResultId) : null
    if (!executionResult) {
        return null
    }

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) {
            workspace.changePanel(requestOrGroupId, newValue)
        }
    }

    const executionRequestResult = executionResult?.type === 'request'
        ? executionResult as WorkbookExecutionRequest
        : undefined
    const executionGroupResult = executionResult?.type === 'group'
        ? executionResult as WorkbookExecutionGroup
        : undefined

    const disableOtherPanels = (!executionRequestResult?.response)

    const longTextInResponse = (executionRequestResult?.response?.body?.text?.length ?? 0)
        > MAX_TEXT_RENDER_LENGTH

    let panel = requestExecution?.panel
    if (executionGroupResult && panel !== 'Info') {
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
        | 'warning',
        SvgIconPropsColorOverrides
    > | undefined = undefined
    if (executionRequestResult) {
        infoColor = executionRequestResult.request
            ? ((executionRequestResult.failedTestCount ?? 0) > 0 ? 'warning' : 'success')
            : 'error'
    } else if (executionGroupResult) {
        infoColor = executionGroupResult.requestsWithErrors > 0
            ? 'error'
            : ((executionGroupResult.requestsWithFailedTestsCount > 0) ? 'warning' : 'success')
    }

    return requestExecution ? (
        <Stack direction={'row'} sx={props.sx}>
            <ToggleButtonGroup
                orientation='vertical'
                exclusive
                onChange={handlePanelChanged}
                value={panel}
                sx={{ marginRight: '24px' }}
                aria-label="text alignment">
                <ToggleButton value="Info" title="Show Result Info" aria-label='show info' size='small'><ScienceIcon color={infoColor ?? 'disabled'} /></ToggleButton>
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' size='small' disabled={disableOtherPanels}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' size='small' disabled={disableOtherPanels}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disableOtherPanels || longTextInResponse} size='small'><PreviewIcon /></ToggleButton>
                <ToggleButton value="Details" title="Show Details" aria-label='show details' size='small' disabled={disableOtherPanels}><SendIcon /></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ overflow: 'hidden', flexGrow: 1, bottom: '0', position: 'relative' }}>
                <Box position='relative' width='100%' height='100%'>
                    {
                        panel === 'Info' ? <ResultInfoViewer requestOrGroupId={requestOrGroupId} executionResultId={executionResultId} />
                            : panel === 'Headers' ? <ResponseHeadersViewer requestOrGroupId={requestOrGroupId} executionResultId={executionResultId} />
                                : panel === 'Preview' ? <ResultResponsePreview
                                    requestOrGroupId={requestOrGroupId} executionResultId={executionResultId}
                                />
                                    : panel === 'Text' ? <ResultRawPreview
                                        requestOrGroupId={requestOrGroupId} executionResultId={executionResultId}
                                    />
                                        : panel === 'Details' ? <ResultDetailsViewer
                                            requestOrGroupId={requestOrGroupId} executionResultId={executionResultId} />
                                            : null
                    }
                </Box>
            </Box>
        </Stack>)
        : null
})
