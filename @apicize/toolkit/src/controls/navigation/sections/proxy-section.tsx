import { GetTitle, Persistence } from "@apicize/lib-typescript"
import { ListItemIcon, ListItemText, Menu, MenuItem, SvgIcon, useTheme } from "@mui/material"
import ProxyIcon from "../../../icons/proxy-icon"
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useState } from "react"
import { ParameterSection } from "./parameter-section"
import { MenuPosition } from "../../../models/menu-position"
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useFeedback } from "../../../contexts/feedback.context"
import { observer } from "mobx-react-lite"
import { useWorkspaceSession } from "../../../contexts/workspace-session.context"

export const ProxySection = observer((props: {
    includeHeader: boolean,
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const theme = useTheme()
    const session = useWorkspaceSession()

    const [proxyMenu, setProxyMenu] = useState<MenuPosition | undefined>(undefined)

    const closeProxyMenu = () => {
        setProxyMenu(undefined)
    }

    const selectProxy = (id: string) => {
        workspace.changeActive(EditableEntityType.Proxy, id)
    }

    const handleAddProxy = (persistence: Persistence, targetProxyId?: string | null) => {
        closeProxyMenu()
        workspace.addProxy(persistence, targetProxyId)
    }

    const handleSelectHeader = (headerId: string, helpTopic?: string) => {
        // closeAllMenus()
        if (helpTopic) {
            session.updateExpanded(headerId, true)
            session.showHelp(helpTopic)
        }
    }

    const handleMoveProxy = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectProxy(id)
        workspace.moveProxy(session.id, id, destinationID, onLowerHalf, isSection)
    }

    const handleDupeProxy = () => {
        closeProxyMenu()
        const id = proxyMenu?.id
        if (!id) return
        workspace.copyProxy(id)
    }

    const showProxyMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setProxyMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence,
            }
        )
    }

    const handleDeleteProxy = () => {
        closeProxyMenu()
        const id = proxyMenu?.id
        if (!id) return
        feedback.confirm({
            title: 'Delete Proxy',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.proxies.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                workspace.deleteProxy(id)
            }
        })
    }

    function ProxyMenu() {
        return proxyMenu
            ? <Menu
                id='proxy-menu'
                open={proxyMenu !== undefined}
                onClose={closeProxyMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: proxyMenu?.mouseY ?? 0,
                    left: proxyMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddProxy(proxyMenu.persistence, proxyMenu?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='proxy'><ProxyIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Proxy</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeProxy()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.proxy.light }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate Proxy</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteProxy()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete Proxy</ListItemText>
                </MenuItem>
            </Menu>
            : <></>
    }

    return <ParameterSection
        title='Proxys'
        includeHeader={props.includeHeader}
        icon={<ProxyIcon />}
        contextMenu={<ProxyMenu />}
        iconColor='proxy'
        helpTopic='workspace/proxies'
        type={EditableEntityType.Proxy}
        parameters={workspace.proxies}
        onSelect={selectProxy}
        onSelectHeader={handleSelectHeader}
        onAdd={handleAddProxy}
        onMove={handleMoveProxy}
        onItemMenu={showProxyMenu}
    />
})