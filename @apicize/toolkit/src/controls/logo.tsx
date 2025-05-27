import { Typography } from "@mui/material";
import { Box } from "@mui/material";
import ApicizeIcon from "../icons/apicize-icon";
import { useApicize } from "../contexts/apicize.context";

export function logo() {
    const apicize = useApicize()
    let name = apicize.appName
    let version = apicize.appVersion

    return <Box className='logo' display='flex'>
        <Box className='logo-icon'>
            <ApicizeIcon width='120' height='120' />
        </Box>
        <Box className='logo-header'>
            <Typography variant='h1' component='div' sx={{ marginBottom: 0 }}>{name}</Typography>
            <Typography variant='h2' component='div'>{version}</Typography>
        </Box>
    </Box>
}