import { Persistence } from "@apicize/lib-typescript";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import SdCardAlertIcon from '@mui/icons-material/SdCardAlert';
import FolderSharedIcon from '@mui/icons-material/FolderShared';

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
                size='small'
                fullWidth
            >
                <MenuItem value={Persistence.Workbook}>Workbook</MenuItem>
                <MenuItem value={Persistence.Private}>
                    <Box display='flex' justifyItems='center'>
                        Workbook (Private)
                        <Box display='inline-flex' width='2em' paddingLeft='0.5em' justifyItems='center' justifyContent='left'>
                            <SdCardAlertIcon color="private" />
                        </Box>
                    </Box>
                </MenuItem>
                <MenuItem value={Persistence.Global}>

                    <Box display='flex' justifyItems='center'>
                        Local Global
                        <Box display='inline-flex' width='2em' paddingLeft='0.5em' justifyItems='center' justifyContent='left'>
                            <FolderSharedIcon color="global" />
                        </Box>
                    </Box>
                </MenuItem>
            </Select>
        </FormControl>
    )
}