import { observer } from "mobx-react-lite";
import { useApicize } from "../../contexts/apicize.context";
import { useWorkspace, WorkspaceMode } from "../../contexts/workspace.context";
import { ToggleButtonGroup, ToggleButton, SvgIcon } from "@mui/material";
import { SxProps } from "@mui/system";
import HelpIcon from '@mui/icons-material/Help'
import SettingsIcon from '@mui/icons-material/Settings'
import LogIcon from "../../icons/log-icon";

export const NavOpsMenu = observer((props: { sx?: SxProps, orientation: 'horizontal' | 'vertical' }) => {
    const apicize = useApicize()
    const workspace = useWorkspace()

    return <ToggleButtonGroup orientation={props.orientation} value={workspace.mode} sx={props.sx}>
        <ToggleButton title='Settings' value={WorkspaceMode.Settings} sx={{ border: 'none', fontSize: apicize.navigationFontSize, padding: '8px', paddingInline: '8px', paddingBlock: '8px' }} onClick={() => workspace.setMode(WorkspaceMode.Settings)}>
            <SettingsIcon />
        </ToggleButton>
        <ToggleButton title='Communication Logs' value={WorkspaceMode.Console} sx={{ border: 'none', fontSize: apicize.navigationFontSize, padding: '8px', paddingInline: '8px', paddingBlock: '8px' }} onClick={() => { workspace.setMode(WorkspaceMode.Console) }}>
            <SvgIcon><LogIcon /></SvgIcon>
        </ToggleButton>
        <ToggleButton title='Help' value={WorkspaceMode.Help} sx={{ border: 'none', fontSize: apicize.navigationFontSize, padding: '8px', paddingInline: '8px', paddingBlock: '8px' }} onClick={() => { workspace.showNextHelpTopic() }}>
            <SvgIcon><HelpIcon /></SvgIcon>
        </ToggleButton>
    </ToggleButtonGroup>
})