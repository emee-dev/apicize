import { EntitySelection } from '../../../models/workbook/entity-selection'
import { MenuItem, FormControl, InputLabel, Select } from '@mui/material'
import { Stack } from '@mui/system'
import { DEFAULT_SELECTION_ID } from '../../../models/store'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestParametersEditor = observer(() => {
    const workspace = useWorkspace()

    if (workspace.active?.entityType !== EditableEntityType.Request && workspace.active?.entityType !== EditableEntityType.Group) {
        return null
    }

    const requestEntry = workspace.active as EditableWorkbookRequest

    let credIndex = 0
    const itemsFromSelections = (selections: EntitySelection[]) => {
        return selections.map(s => (
            <MenuItem key={`creds-${credIndex++}`} value={s.id}>{s.name}</MenuItem>
        ))
    }

    const lists = workspace.getRequestParameterLists()

    return (
        <Stack spacing={3}>
            <FormControl>
                <InputLabel id='scenario-label-id'>Scenarios</InputLabel>
                <Select
                    labelId='scenario-label'
                    aria-labelledby='scenario-label-id'
                    id='cred-scenario'
                    label='Scenario'
                    value={requestEntry.selectedScenario?.id ?? DEFAULT_SELECTION_ID}
                    onChange={(e) => workspace.setRequestSelectedScenarioId(e.target.value)}
                    fullWidth
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
                >
                    {itemsFromSelections(lists.proxies)}
                </Select>
            </FormControl>
        </Stack>
    )
})
