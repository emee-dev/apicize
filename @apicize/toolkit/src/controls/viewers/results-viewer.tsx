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
import { ResultRequestViewer } from "./result/result-request-viewer";
import { RequestRunProgress } from "./result/requuest-run-progress";
import { observer } from 'mobx-react-lite';
import { EditableEntityType } from '../../models/workbook/editable-entity-type';
import { useWorkspace } from "../../contexts/workspace.context";
import { WorkbookExecutionGroupResult, WorkbookExecutionRequestResult } from "../../models/workbook/workbook-execution";
import { toJS } from "mobx";

export const ResultsViewer = observer((props: {
    sx: SxProps<Theme>
}) => {
    const workspace = useWorkspace()

    if ((!workspace.active) ||
        (workspace.active.entityType !== EditableEntityType.Request
            && workspace.active.entityType !== EditableEntityType.Group)) {
        return null
    }
    const requestOrGroupId = workspace.active.id

    const requestExecution = workspace.requestExecutions.get(workspace.active.id)
    const executionResult = workspace.getExecutionResult(workspace.active.id,
        requestExecution?.resultIndex ?? 0)

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) {
            workspace.changePanel(requestOrGroupId, newValue)
        }
    }

    const executionRequestResult = executionResult?.type === 'request'
        ? executionResult as WorkbookExecutionRequestResult
        : undefined
    const executionGroupResult = executionResult?.type === 'group'
        ? executionResult as WorkbookExecutionGroupResult
        : undefined

    const disableOtherPanels = requestExecution?.running || (executionRequestResult?.disableOtherPanels ?? true)
    const disableRequest = requestExecution?.running || (!executionRequestResult?.request)

    const resultIndex = requestExecution?.resultIndex ?? NaN


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

    return requestExecution && executionResult ? (
        <Stack direction={'row'} sx={props.sx}>
            <ToggleButtonGroup
                orientation='vertical'
                exclusive
                onChange={handlePanelChanged}
                value={requestExecution.running ? 'Info' : panel}
                sx={{ marginRight: '24px' }}
                aria-label="text alignment">
                <ToggleButton value="Info" title="Show Result Info" aria-label='show info' disabled={requestExecution.running}><ScienceIcon color={infoColor ?? 'disabled'} /></ToggleButton>
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' disabled={disableOtherPanels}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' disabled={disableOtherPanels}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disableOtherPanels || executionRequestResult?.longTextInResponse === true}><PreviewIcon /></ToggleButton>
                <ToggleButton value="Request" title="Show Request" aria-label='show request' disabled={disableRequest}><SendIcon /></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ overflow: 'hidden', flexGrow: 1, bottom: '0', position: 'relative' }}>
                {
                    requestExecution.running ? <RequestRunProgress /> :
                        panel === 'Info' ? <ResultInfoViewer requestOrGroupId={requestOrGroupId} index={resultIndex} />
                            : panel === 'Headers' ? <ResponseHeadersViewer requestOrGroupId={requestOrGroupId} index={resultIndex} />
                                : panel === 'Preview' ? <ResultResponsePreview
                                    requestOrGroupId={requestOrGroupId} index={resultIndex}
                                />
                                    : panel === 'Text' ? <ResultRawPreview
                                        requestOrGroupId={requestOrGroupId} index={resultIndex}
                                    />
                                        : panel === 'Request' ? <ResultRequestViewer
                                            requestOrGroupId={requestOrGroupId} index={resultIndex} />
                                            : null
                }
            </Box>
        </Stack>)
        : null
})
