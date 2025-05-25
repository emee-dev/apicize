import { Typography } from "@mui/material";
import { Box } from "@mui/material";
import ApicizeIcon from "../icons/apicize-icon";
import { useApicize } from "../contexts/apicize.context";

export function logo() {
    const apicize = useApicize()
    let name = apicize.appName
    let version = apicize.appVersion

    return <Box className='logo' display='flex'>
        <Box display='flex' flexDirection='column' justifyContent='center'>
            <ApicizeIcon width='120' height='120' />
        </Box>
        <Box marginLeft='48px' flexDirection='column' display='flex' justifyContent='start'>
            <Typography variant='h1' fontSize='48px' component='div' sx={{ marginBottom: 0 }}>{name}</Typography>
            <Typography variant='h2' fontSize='18px' component='div'>{version}</Typography>
        </Box>
    </Box>
}