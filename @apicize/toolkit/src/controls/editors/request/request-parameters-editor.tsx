import { EntitySelection } from '../../../models/workspace/entity-selection'
import { MenuItem, FormControl, InputLabel, Select } from '@mui/material'
import { Stack } from '@mui/material'
import { DEFAULT_SELECTION_ID } from '../../../models/store'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'
import { EditableRequestGroup } from '../../../models/workspace/editable-request-group'
import { useWorkspaceSession } from '../../../contexts/workspace-session.context'

export const RequestParametersEditor = observer((props: { requestEntry: EditableRequest | EditableRequestGroup }) => {
    const workspace = useWorkspace()
    const session = useWorkspaceSession()
    session.nextHelpTopic = 'requests/parameters'

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const lists = workspace.getRequestParameterLists(props.requestEntry)

    return (
        <Stack spacing={3}>
            <FormControl>
                <InputLabel id='scenario-label-id'>Scenario</InputLabel>
                <Select
                    labelId='scenario-label'
                    aria-labelledby='scenario-label-id'
                    id='cred-scenario'
                    label='Scenario'
                    value={props.requestEntry.selectedScenario?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => props.requestEntry.setSelectedScenarioId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(lists.scenarios)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='auth-label-id'>Authorization</InputLabel>
                <Select
                    labelId='auth-label'
                    aria-labelledby='auth-label-id'
                    id='cred-auth'
                    label='Authorization'
                    value={props.requestEntry.selectedAuthorization?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => props.requestEntry.setSelectedAuthorizationId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(lists.authorizations)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='cert-label-id'>Certificate</InputLabel>
                <Select
                    labelId='cert-label'
                    aria-labelledby='cert-label-id'
                    id='cred-cert'
                    label='Certificate'
                    value={props.requestEntry.selectedCertificate?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => props.requestEntry.setSelectedCertificateId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(lists.certificates)}
                </Select>
            </FormControl>
            <FormControl>
                <InputLabel id='proxy-label-id'>Proxy</InputLabel>
                <Select
                    labelId='proxy-label'
                    aria-labelledby='proxy-label-id'
                    id='cred-proxy'
                    label='Proxy'
                    value={props.requestEntry.selectedProxy?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => props.requestEntry.setSelectedProxyId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(lists.proxies)}
                </Select>
            </FormControl>
        </Stack>
    )
})
