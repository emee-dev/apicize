import { GetTitle, Persistence } from "@apicize/lib-typescript"
import { ListItemIcon, ListItemText, Menu, MenuItem, SvgIcon, useTheme } from "@mui/material"
import AuthorizationIcon from "../../../icons/auth-icon";
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useState } from "react"
import { ParameterSection } from "../parameter-section"
import { MenuPosition } from "../../../models/menu-position"
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useFeedback } from "../../../contexts/feedback.context"
import { observer } from "mobx-react-lite";

export const AuthorizationSection = observer((props: {
    includeHeader: boolean,
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const theme = useTheme()

    const [authorizationMenu, setAuthorizationMenu] = useState<MenuPosition | undefined>(undefined)

    const closeAuthorizationMenu = () => {
        setAuthorizationMenu(undefined)
    }

    const selectAuthorization = (id: string) => {
        workspace.changeActive(EditableEntityType.Authorization, id)
    }

    const handleAddAuthorization = (persistence: Persistence, targetAuthorizationId?: string | null) => {
        closeAuthorizationMenu()
        workspace.addAuthorization(persistence, targetAuthorizationId)
    }

    const handleSelectHeader = (headerId: string, helpTopic?: string) => {
        // closeAllMenus()
        if (helpTopic) {
            workspace.updateExpanded(headerId, true)
            workspace.showHelp(helpTopic)
        }
    }

    const handleMoveAuthorization = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectAuthorization(id)
        workspace.moveAuthorization(id, destinationID, onLowerHalf, isSection)
    }

    const handleDupeAuthorization = () => {
        closeAuthorizationMenu()
        if (workspace.active?.entityType === EditableEntityType.Authorization && workspace.active?.id) workspace.copyAuthorization(workspace.active?.id)
    }

    const showAuthorizationMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setAuthorizationMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence,
            }
        )
    }

    const handleDeleteAuthorization = () => {
        closeAuthorizationMenu()
        if (!workspace.active?.id || workspace.active?.entityType !== EditableEntityType.Authorization) return
        const id = workspace.active?.id
        feedback.confirm({
            title: 'Delete Authorization',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.authorizations.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                workspace.deleteAuthorization(id)
            }
        })
    }

    function AuthorizationMenu() {
        return authorizationMenu
            ? <Menu
                id='authorization-menu'
                open={authorizationMenu !== undefined}
                onClose={closeAuthorizationMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: authorizationMenu?.mouseY ?? 0,
                    left: authorizationMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddAuthorization(authorizationMenu.persistence, workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='authorization'><AuthorizationIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Authorization</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeAuthorization()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.authorization.light }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate Authorization</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteAuthorization()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete Authorization</ListItemText>
                </MenuItem>
            </Menu>
            : <></>
    }

    if (!props.includeHeader && !workspace.navTreeInitialized.has(EditableEntityType.Authorization)) {
        workspace.updateExpanded(['hdr-a-pub', 'hdr-a-priv', 'hdr-a-vault'], true)
        workspace.setInitialized(EditableEntityType.Authorization)
    }

    return <ParameterSection
        title='Authorizations'
        includeHeader={props.includeHeader}
        icon={<AuthorizationIcon />}
        contextMenu={<AuthorizationMenu />}
        iconColor='authorization'
        helpTopic='workspace/authorizations'
        type={EditableEntityType.Authorization}
        parameters={workspace.authorizations}
        onSelect={selectAuthorization}
        onSelectHeader={handleSelectHeader}
        onAdd={handleAddAuthorization}
        onMove={handleMoveAuthorization}
        onItemMenu={showAuthorizationMenu}
    />
})