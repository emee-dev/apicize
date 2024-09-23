import { TextField, SxProps, Grid, FormControl, InputLabel, MenuItem, Select, Grid2 } from '@mui/material'
import { WorkbookGroupExecution } from '@apicize/lib-typescript';
import { EditableWorkbookRequestGroup } from '../../../models/workbook/editable-workbook-request';
import { observer } from 'mobx-react-lite';
import { useWorkspace } from '../../../contexts/workspace.context';

export const RequestGroupEditor = observer((props: {
    sx?: SxProps
}) => {
    const workspace = useWorkspace()

    const group = workspace.active as EditableWorkbookRequestGroup

    return (
        <Grid2 container direction='column' spacing={3} maxWidth={1000} sx={props.sx}>
            <Grid2>
                <TextField
                    id='group-name'
                    label='Name'
                    aria-label='group name'
                    sx={{ flexGrow: 1 }}
                    fullWidth
                    // size='small'
                    value={group.name}
                    onChange={e => workspace.setName(e.target.value)}
                />
            </Grid2>
            <Grid2>
                <FormControl>
                    <InputLabel id='execution-label-id'>Execution Mode</InputLabel>
                    <Select
                        labelId='execution-id'
                        id='execution'
                        aria-labelledby='execution-label-id'
                        value={group.execution}
                        label='Type'
                        onChange={e => workspace.setGroupExecution(e.target.value as WorkbookGroupExecution)}
                    >
                        <MenuItem value={WorkbookGroupExecution.Sequential}>Sequential</MenuItem>
                        <MenuItem value={WorkbookGroupExecution.Concurrent}>Concurrent</MenuItem>
                    </Select>
                </FormControl>
            </Grid2>
        </Grid2 >
    )
})