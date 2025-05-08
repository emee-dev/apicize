import { Persistence } from "@apicize/lib-typescript"
import { ListItemIcon, ListItemText, Menu, MenuItem, SvgIcon, useTheme } from "@mui/material"
import ProxyIcon from "../../../icons/proxy-icon"
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { EntityType } from "../../../models/workspace/entity-type"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useState } from "react"
import { ParameterSection } from "./parameter-section"
import { MenuPosition } from "../../../models/menu-position"
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useFeedback } from "../../../contexts/feedback.context"
import { observer } from "mobx-react-lite"
import { IndexedEntityPosition } from "../../../models/workspace/indexed-entity-position"

export const ProxySection = observer((props: {
    includeHeader: boolean,
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const theme = useTheme()

    const [proxyMenu, setProxyMenu] = useState<MenuPosition | undefined>(undefined)

    const closeProxyMenu = () => {
        setProxyMenu(undefined)
    }

    const selectProxy = (id: string) => {
        workspace.changeActive(EntityType.Proxy, id)
    }

    const handleAddProxy = (relativeToId: string, relativePosition: IndexedEntityPosition) => {
        closeProxyMenu()
        workspace.addProxy(relativeToId, relativePosition, null)
    }

    const handleSelectHeader = (headerId: string, helpTopic?: string) => {
        // closeAllMenus()
        if (helpTopic) {
            workspace.updateExpanded(headerId, true)
            workspace.showHelp(helpTopic)
        }
    }

    const handleMoveProxy = (id: string, relativeToId: string, relativePosition: IndexedEntityPosition) => {
        selectProxy(id)
        workspace.moveProxy(id, relativeToId, relativePosition)
    }

    const handleDupeProxy = () => {
        closeProxyMenu()
        const id = proxyMenu?.id
        if (!id) return
        workspace.addProxy(id, IndexedEntityPosition.After, id)
    }

    const showProxyMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setProxyMenu(
            {
                id,
                type: EntityType.Proxy,
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
            message: `Are you are you sure you want to delete ${workspace.getNavigationName(id)}?`,
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
                <MenuItem onClick={(_) => handleAddProxy(proxyMenu.id, IndexedEntityPosition.After)}>
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
        type={EntityType.Proxy}
        parameters={workspace.navigation.proxies}
        onSelect={selectProxy}
        onSelectHeader={handleSelectHeader}
        onAdd={handleAddProxy}
        onMove={handleMoveProxy}
        onItemMenu={showProxyMenu}
    />
})