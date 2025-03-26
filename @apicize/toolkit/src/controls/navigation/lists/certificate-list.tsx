import { Box, Stack, SxProps } from "@mui/system"
import { SvgIcon, IconButton } from "@mui/material"
import { EditorTitle } from "../../editor-title"
import CloseIcon from '@mui/icons-material/Close';
import CertificateIcon from "../../../icons/certificate-icon";
import { CertificateSection } from "../sections/certificate-section";
import { observer } from "mobx-react-lite";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { useWorkspaceSession } from "../../../contexts/workspace-session.context";

export const CertificateList = observer((props: {
    sx?: SxProps
}) => {
    const session = useWorkspaceSession()

    session.nextHelpTopic = 'workspace/certificates'

    return <Box sx={props.sx} className='editor'>
        <Stack direction='row' className='editor-panel-header' flexGrow={0}>
            <EditorTitle icon={<SvgIcon color='certificate'><CertificateIcon /></SvgIcon>} name='Certificates'>
                <IconButton color='primary' size='medium' aria-label='Close' title='Close' sx={{ marginLeft: '1rem' }} onClick={() => session.returnToNormal()}><CloseIcon fontSize='inherit' /></IconButton>
            </EditorTitle>
        </Stack>
        <Box className='editor-list'>
            <Box sx={{ width: 'fit-content' }}>
                <SimpleTreeView
                    expandedItems={session.expandedItems}
                    sx={props.sx}
                    multiSelect={false}
                    onItemExpansionToggle={(_, id, isExpanded) => {
                        session.updateExpanded(id, isExpanded)
                    }}
                >
                    <CertificateSection includeHeader={false} />
                </SimpleTreeView>
            </Box>
        </Box>
    </Box>
})