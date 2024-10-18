import { GenerateIdentifier } from "../../../services/random-identifier-generator"
import { Box, Grid2, Stack, Typography } from "@mui/material"
import { useWorkspace } from "../../../contexts/workspace.context"
import { toJS } from "mobx"
import { wrap } from "module"

export function ResponseHeadersViewer(props: { requestOrGroupId: string, index: number }) {
    const workspace = useWorkspace()

    const result = workspace.getExecutionResult(props.requestOrGroupId, props.index)

    if (result?.type !== 'request') {
        return null
    }

    const headers = Object.entries(result.response?.headers ?? {})
    console.log('headers', headers)

    return (
        <Stack direction="column" sx={{ flexGrow: 1, maxWidth: '80em', position: 'absolute', top: '0', bottom: '0' }}>
            {
                headers.length > 0
                    ? <Box overflow='auto' paddingRight='24px' height='100%'>
                        <Typography variant='h2' sx={{ marginTop: 0, marginBottom: '2em', flexGrow: 0 }} component='div'>Response Headers</Typography>
                        <Grid2 container rowSpacing='1em'>
                            {
                                headers.map(([header, value]) =>
                                    <Grid2 container size={12}>
                                        <Grid2 size={{ md: 6, lg: 4 }}>{header}</Grid2>
                                        <Grid2 size={{ md: 6, lg: 8 }} sx={{wordBreak: 'break-word'}}>{value}</Grid2>
                                    </Grid2>
                                )
                            }
                        </Grid2>
                    </Box>
                    : <Typography variant='h2' sx={{ marginTop: 0, flexGrow: 0 }} component='div'>No headers included in response</Typography>
            }
        </Stack>
    )
}

