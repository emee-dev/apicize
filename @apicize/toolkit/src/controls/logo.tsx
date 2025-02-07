import { SvgIcon, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useWorkspace } from "../contexts/workspace.context";
import ApicizeIcon from "../icons/apicize-icon";

export function logo() {
    const workspace = useWorkspace()
    let name = workspace.appName
    let version = workspace.appVersion

    return <Box display='flex'>
        <Box>
            <ApicizeIcon width='120' height='120' />
        </Box>
        <Box marginLeft='24px'>
            <Typography variant='h1' fontSize='48px' component='div' sx={{ marginBottom: 0 }}>{name}</Typography>
            <Typography variant='h2' fontSize='18px' component='div'>{version}</Typography>
        </Box>
    </Box>
}