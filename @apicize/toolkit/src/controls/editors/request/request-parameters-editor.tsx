import { MenuItem, FormControl, InputLabel, Select } from '@mui/material'
import { Stack } from '@mui/material'
import { DEFAULT_SELECTION_ID } from '../../../models/store'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'
import { EditableRequestGroup } from '../../../models/workspace/editable-request-group'
import { WorkspaceParameters } from '../../../models/workspace/workspace-parameters'
import { Selection } from '@apicize/lib-typescript'
import { EditableRequest } from '../../../models/workspace/editable-request'

export const RequestParametersEditor = observer((props: {
    requestOrGroup: EditableRequest | EditableRequestGroup,
    parameters: WorkspaceParameters | null
}) => {
    const workspace = useWorkspace()
    workspace.nextHelpTopic = 'requests/parameters'

    const requestOrGroup = props.requestOrGroup
    const parameters = props.parameters
    
    if (!parameters) {
        workspace.activeSelection?.initializeParameters()
        return null
    }


    let credIndex = 0
    const itemsFromSelections = (selections: Selection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    return (
        <Stack spacing={3}>
            <FormControl>
                <InputLabel id='scenario-label-id'>Scenario</InputLabel>
                <Select
                    labelId='scenario-label'
                    aria-labelledby='scenario-label-id'
                    id='cred-scenario'
                    label='Scenario'
                    value={requestOrGroup.selectedScenario?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => requestOrGroup.setSelectedScenarioId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(parameters.scenarios)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='auth-label-id'>Authorization</InputLabel>
                <Select
                    labelId='auth-label'
                    aria-labelledby='auth-label-id'
                    id='cred-auth'
                    label='Authorization'
                    value={requestOrGroup.selectedAuthorization?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => requestOrGroup.setSelectedAuthorizationId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(parameters.authorizations)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cert-label-id'>Certificate</InputLabel>
                <Select
                    labelId='cert-label'
                    aria-labelledby='cert-label-id'
                    id='cred-cert'
                    label='Certificate'
                    value={requestOrGroup.selectedCertificate?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => requestOrGroup.setSelectedCertificateId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(parameters.certificates)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='proxy-label-id'>Proxy</InputLabel>
                <Select
                    labelId='proxy-label'
                    aria-labelledby='proxy-label-id'
                    id='cred-proxy'
                    label='Proxy'
                    value={requestOrGroup.selectedProxy?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => requestOrGroup.setSelectedProxyId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(parameters.proxies)}
                </Select>
            </FormControl>
        </Stack>
    )
})
