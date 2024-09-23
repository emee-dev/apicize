import { Persistence } from "@apicize/lib-typescript";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export function PersistenceEditor(props: { 
    persistence: Persistence,
    onUpdatePersistence: (value: Persistence) => void
}) {
    return (
        <FormControl>
            <InputLabel id='storage-type-label-id'>Storage</InputLabel>
            <Select
                labelId='storage-type-label'
                aria-labelledby="storage-type-label-id"
                id='storage-type'
                value={props.persistence}
                label='Storage'
                onChange={e => props.onUpdatePersistence(e.target.value as Persistence)}
                fullWidth
            >
                <MenuItem value={Persistence.Workbook}>Workbook</MenuItem>
                <MenuItem value={Persistence.Private}>Workbook (Private)</MenuItem>
                <MenuItem value={Persistence.Global}>Local Global</MenuItem>
            </Select>
        </FormControl>
    )
}