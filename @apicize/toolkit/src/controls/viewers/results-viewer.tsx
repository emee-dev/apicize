import { Box, Stack, SxProps, Theme, ToggleButton, ToggleButtonGroup } from "@mui/material"
import ScienceIcon from '@mui/icons-material/ScienceOutlined'
import SendIcon from '@mui/icons-material/Send';
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

export const ResultsViewer = observer((props: {
    sx: SxProps<Theme>
}) => {
    const workspace = useWorkspace()

    if ((! workspace.active) ||
        (workspace.active.entityType !== EditableEntityType.Request 
            && workspace.active.entityType !== EditableEntityType.Group)) {
        return null
    }
    const requestOrGroupId = workspace.active.id

    const requestExecution = workspace.requestExecutions.get(workspace.active.id)
    const executionResult = workspace.getExecutionResult(workspace.active.id,
        requestExecution?.runIndex ?? NaN, requestExecution?.resultIndex ?? 0)

    const groupSummary = workspace.getExecutionGroupSummary(workspace.active.id,
        requestExecution?.runIndex ?? NaN)

    const handlePanelChanged = (_: React.SyntheticEvent, newValue: string) => {
        if (newValue) {
            workspace.changePanel(requestOrGroupId, newValue)
        }
    }

    const disableOtherPanels = requestExecution?.running || (executionResult?.disableOtherPanels ?? true)
    const disableRequest = requestExecution?.running || (! executionResult?.hasRequest === true)

    const runIndex = requestExecution?.runIndex ?? NaN
    const resultIndex = requestExecution?.resultIndex ?? NaN

    let panel = requestExecution?.panel
    if (resultIndex === -1 && panel !== 'Info') {
        panel = 'Info'
    }

    return requestExecution && (executionResult || groupSummary) ? (
        <Stack direction={'row'} sx={props.sx}>
            <ToggleButtonGroup
                orientation='vertical'
                exclusive
                onChange={handlePanelChanged}
                value={requestExecution.running ? 'Info' : panel}
                sx={{ marginRight: '24px' }}
                aria-label="text alignment">
                <ToggleButton value="Info" title="Show Result Info" aria-label='show info' disabled={requestExecution.running}><ScienceIcon color={executionResult?.infoColor ?? groupSummary?.infoColor ?? 'disabled'} /></ToggleButton>
                <ToggleButton value="Headers" title="Show Response Headers" aria-label='show headers' disabled={disableOtherPanels}><ViewListOutlinedIcon /></ToggleButton>
                <ToggleButton value="Text" title="Show Response Body as Text" aria-label='show body text' disabled={disableOtherPanels}><ArticleOutlinedIcon /></ToggleButton>
                <ToggleButton value="Preview" title="Show Body as Preview" aria-label='show body preview' disabled={disableOtherPanels || executionResult?.longTextInResponse === true}><PreviewIcon /></ToggleButton>
                <ToggleButton value="Request" title="Show Request" aria-label='show request' disabled={disableRequest}><SendIcon /></ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ overflow: 'hidden', flexGrow: 1, bottom: '0', position: 'relative' }}>
                {
                    requestExecution.running ? <RequestRunProgress /> :
                        panel === 'Info' ? <ResultInfoViewer requestOrGroupId={requestOrGroupId} runIndex={runIndex} resultIndex={resultIndex} />
                            : panel === 'Headers' ? <ResponseHeadersViewer requestOrGroupId={requestOrGroupId} runIndex={runIndex} resultIndex={resultIndex} />
                                : panel === 'Preview' ? <ResultResponsePreview
                                    requestOrGroupId={requestOrGroupId}
                                    runIndex={runIndex} resultIndex={resultIndex}
                                />
                                    : panel === 'Text' ? <ResultRawPreview
                                        requestOrGroupId={requestOrGroupId}
                                        runIndex={runIndex}
                                        resultIndex={resultIndex}
                                    />
                                        : panel === 'Request' ? <ResultRequestViewer
                                            requestOrGroupId={requestOrGroupId}
                                            runIndex={runIndex}
                                            resultIndex={resultIndex} />
                                            : null
                }
            </Box>
        </Stack>)
        : null
})
