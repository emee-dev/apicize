import { EntitySelection } from '../../../models/workspace/entity-selection'
import { MenuItem, FormControl, InputLabel, Select } from '@mui/material'
import { Stack } from '@mui/material'
import { DEFAULT_SELECTION_ID } from '../../../models/store'
import { EditableRequest } from '../../../models/workspace/editable-request'
import { EditableEntityType } from '../../../models/workspace/editable-entity-type'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestParametersEditor = observer(() => {
    const workspace = useWorkspace()

    if (workspace.active?.entityType !== EditableEntityType.Request && workspace.active?.entityType !== EditableEntityType.Group) {
        return null
    }

    workspace.nextHelpTopic = 'requests/parameters'
    const requestEntry = workspace.active as EditableRequest

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const lists = workspace.getRequestParameterLists()

    return (
        <Stack spacing={3} maxWidth='60em'>
            <FormControl>
                <InputLabel id='scenario-label-id'>Scenario</InputLabel>
                <Select
                    labelId='scenario-label'
                    aria-labelledby='scenario-label-id'
                    id='cred-scenario'
                    label='Scenario'
                    value={requestEntry.selectedScenario?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedScenarioId(e.target.value)}
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
                    value={requestEntry.selectedAuthorization?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedAuthorizationId(e.target.value)}
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
                    value={requestEntry.selectedCertificate?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedCertificateId(e.target.value)}
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
                    value={requestEntry.selectedProxy?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedProxyId(e.target.value)}
                    fullWidth
                    size='small'
                >
                    {itemsFromSelections(lists.proxies)}
                </Select>
            </FormControl>
        </Stack>
    )
})
