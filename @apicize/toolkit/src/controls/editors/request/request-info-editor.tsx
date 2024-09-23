import { TextField, Select, MenuItem, FormControl, InputLabel, Box, Grid2 } from '@mui/material'
import { WorkbookMethod, WorkbookMethods } from '@apicize/lib-typescript'
import { EditableEntityType } from '../../../models/workbook/editable-entity-type'
import { EditableWorkbookRequest } from '../../../models/workbook/editable-workbook-request'
import { observer } from 'mobx-react-lite'
import { useWorkspace } from '../../../contexts/workspace.context'

export const RequestInfoEditor = observer(() => {
    const workspace = useWorkspace()
    
    if (workspace.active?.entityType !== EditableEntityType.Request) {
        return null
    }

    const request = workspace.active as EditableWorkbookRequest

    const methodMenuItems = () => {
        return WorkbookMethods.map(method => (
            <MenuItem key={method} value={method}>{method}</MenuItem>
        ))
    }

    return (
        <Grid2 container direction='column' spacing={3} maxWidth={1000}>
            <Grid2>
                <TextField
                    id='request-name'
                    label="Name"
                    aria-label='request name'
                    required
                    // size="small"
                    value={request.name}
                    onChange={e => workspace.setName(e.target.value)}
                    error={request.nameInvalid}
                    helperText={request.nameInvalid ? 'Request name is required' : ''}
                    fullWidth
                />
            </Grid2>
            <Grid2>
                <TextField
                    id='request-url'
                    label="URL"
                    aria-label='request url'
                    required
                    // size="small"
                    value={request.url}
                    onChange={e => workspace.setRequestUrl(e.target.value)}
                    error={request.urlInvalid}
                    helperText={request.urlInvalid ? 'URL must include http/https protocol prefix and address' : ''}
                    fullWidth
                />
            </Grid2>
            <Grid2>
                <FormControl>
                    <InputLabel id='request-method-label-id'>Method</InputLabel>
                    <Select
                        labelId='request-method-label-id'
                        aria-labelledby='request-method-label-id'
                        id="request-method"
                        value={request.method}
                        label="Method"
                        onChange={e => workspace.setRequestMethod(e.target.value as WorkbookMethod)}
                    >
                        {methodMenuItems()}
                    </Select>
                </FormControl>
                <FormControl>
                    <TextField
                        aria-label='request timeout in milliseconds'
                        placeholder='Timeout in Milliseconds'
                        label='Timeout'
                        sx={{marginLeft: '24px', width: '8em'}}
                        type='number'
                        value={request.timeout}
                        onChange={e => workspace.setRequestTimeout(parseInt(e.target.value))}
                    />
                </FormControl>
            </Grid2>
        </Grid2>
    )
})
