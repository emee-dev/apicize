import { SxProps, Box, Alert, Grid } from '@mui/material'
import { observer } from 'mobx-react-lite';
import { EditableWarnings } from '../../models/workspace/editable-warnings';

export const WarningsEditor = observer((props: { sx?: SxProps, warnings: EditableWarnings, onDelete: (id: string) => void }) => {
    return <Grid container direction='column' spacing={3}>
        {
            props.warnings.hasEntries
                ?
                [...props.warnings.entries].map(e =>
                    <Alert key={e[0]} variant='outlined' severity='warning' onClose={() => props.onDelete(e[0])}>
                        {e[1]}
                    </Alert>
                )
                : <Box>No Warnings</Box>
        }
    </Grid>
})

