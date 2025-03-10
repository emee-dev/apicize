import { GetTitle, Persistence } from "@apicize/lib-typescript"
import { ListItemIcon, ListItemText, Menu, MenuItem, SvgIcon, useTheme } from "@mui/material"
import CertificateIcon from "../../../icons/certificate-icon"
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useState } from "react"
import { ParameterSection } from "../parameter-section"
import { MenuPosition } from "../../../models/menu-position"
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useFeedback } from "../../../contexts/feedback.context"
import { observer } from "mobx-react-lite"

export const CertificateSection = observer((props: {
    includeHeader: boolean,
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const theme = useTheme()

    const [certificateMenu, setCertificateMenu] = useState<MenuPosition | undefined>(undefined)

    const closeCertificateMenu = () => {
        setCertificateMenu(undefined)
    }

    const selectCertificate = (id: string) => {
        workspace.changeActive(EditableEntityType.Certificate, id)
    }

    const handleAddCertificate = (persistence: Persistence, targetCertificateId?: string | null) => {
        closeCertificateMenu()
        workspace.addCertificate(persistence, targetCertificateId)
    }

    const handleSelectHeader = (headerId: string, helpTopic?: string) => {
        // closeAllMenus()
        if (helpTopic) {
            workspace.updateExpanded(headerId, true)
            workspace.showHelp(helpTopic)
        }
    }

    const handleMoveCertificate = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectCertificate(id)
        workspace.moveCertificate(id, destinationID, onLowerHalf, isSection)
    }

    const handleDupeCertificate = () => {
        closeCertificateMenu()
        if (workspace.active?.entityType === EditableEntityType.Certificate && workspace.active?.id) workspace.copyCertificate(workspace.active?.id)
    }

    const showCertificateMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setCertificateMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence,
            }
        )
    }

    const handleDeleteCertificate = () => {
        closeCertificateMenu()
        if (!workspace.active?.id || workspace.active?.entityType !== EditableEntityType.Certificate) return
        const id = workspace.active?.id
        feedback.confirm({
            title: 'Delete Certificate',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.certificates.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                workspace.deleteCertificate(id)
            }
        })
    }

    function CertificateMenu() {
        return certificateMenu
            ? <Menu
                id='certificate-menu'
                open={certificateMenu !== undefined}
                onClose={closeCertificateMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: certificateMenu?.mouseY ?? 0,
                    left: certificateMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddCertificate(certificateMenu.persistence, workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='certificate'><CertificateIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Certificate</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeCertificate()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.certificate.light }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate Certificate</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteCertificate()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete Certificate</ListItemText>
                </MenuItem>
            </Menu>
            : <></>
    }

    if (!props.includeHeader && !workspace.navTreeInitialized.has(EditableEntityType.Certificate)) {
        workspace.updateExpanded(['hdr-c-pub', 'hdr-c-priv', 'hdr-c-vault'], true)
        workspace.setInitialized(EditableEntityType.Certificate)
    }

    return <ParameterSection
        title='Certificates'
        includeHeader={props.includeHeader}
        icon={<CertificateIcon />}
        contextMenu={<CertificateMenu />}
        iconColor='certificate'
        helpTopic='workspace/certificates'
        type={EditableEntityType.Certificate}
        parameters={workspace.certificates}
        onSelect={selectCertificate}
        onSelectHeader={handleSelectHeader}
        onAdd={handleAddCertificate}
        onMove={handleMoveCertificate}
        onItemMenu={showCertificateMenu}
    />
})