import { SvgIcon, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material"
import { Box } from "@mui/system"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import FolderIcon from "../../../icons/folder-icon"
import RequestIcon from "../../../icons/request-icon"
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { EditableRequest } from "../../../models/workspace/editable-request"
import { EditableRequestGroup } from "../../../models/workspace/editable-request-group"
import { NavTreeItem } from "../nav-tree-item"
import { GetTitle, Persistence } from "@apicize/lib-typescript"
import { MenuPosition } from "../../../models/menu-position"
import { useState } from "react"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useFeedback } from "../../../contexts/feedback.context"
import { observer } from "mobx-react-lite"
import { useWorkspaceSession } from "../../../contexts/workspace-session.context"
import { useApicize } from "../../../contexts/apicize.context"

export const RequestSection = observer((props: {
    includeHeader?: boolean,
}) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
    const session = useWorkspaceSession()
    const settings = useApicize()

    const [requestsMenu, setRequestsMenu] = useState<MenuPosition | undefined>()
    const [requestMenu, setRequestMenu] = useState<MenuPosition | undefined>(undefined)
    const [focused, setFocused] = useState<boolean>(false)

    const closeRequestsMenu = () => {
        setRequestsMenu(undefined)
    }

    const closeRequestMenu = () => {
        setRequestMenu(undefined)
    }

    const handleShowRequestsMenu = (event: React.MouseEvent, id: string) => {
        setRequestsMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence: Persistence.Workbook,
            }
        )
    }

    const showRequestMenu = (event: React.MouseEvent, id: string) => {
        setRequestMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence: Persistence.Workbook,
            }
        )
    }


    const handleSelectHeader = (headerId: string, helpTopic?: string) => {
        // closeAllMenus()
        if (helpTopic) {
            session.updateExpanded(headerId, true)
            session.showHelp(helpTopic)
        }
    }
    const handleAddRequest = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspace.addRequest(session.id, targetRequestId)
    }

    const handleAddRequestGroup = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspace.addGroup(targetRequestId)
    }

    const handleDeleteRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        const id = requestsMenu?.id ?? requestMenu?.id
        if (!id) return
        feedback.confirm({
            title: 'Delete Request',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.requests.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                workspace.deleteRequest(id)
            }
        })
    }

    const handleMoveRequest = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectRequestOrGroup(id)
        workspace.moveRequest(session.id, id, destinationID, onLowerHalf, isSection)
    }

    const handleDupeRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        const id = requestsMenu?.id ?? requestMenu?.id
        if (!id) return
        workspace.copyRequest(session.id, id)
    }

    const selectRequestOrGroup = (id: string) => {
        workspace.changeActive(EditableEntityType.Request, id)
    }

    function RequestsMenu() {
        return (
            <Menu
                id='requests-menu'
                open={requestsMenu !== undefined}
                sx={{fontSize: settings.navigationFontSize}}
                onClose={closeRequestsMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: requestsMenu?.mouseY ?? 0,
                    left: requestsMenu?.mouseX ?? 0
                }}
            >
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequest()} >
                    <ListItemIcon>
                        <SvgIcon fontSize='inherit' color='request'><RequestIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText sx={{fontSize: settings.navigationFontSize}} disableTypography>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequestGroup()}>
                    <ListItemIcon>
                        <SvgIcon fontSize='inherit' color='folder'><FolderIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText sx={{fontSize: settings.navigationFontSize}} disableTypography>Add Group</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    function RequestMenu() {
        return (
            <Menu
                id='req-menu'
                open={requestMenu !== undefined}
                sx={{fontSize: settings.navigationFontSize}}
                onClose={closeRequestMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: requestMenu?.mouseY ?? 0,
                    left: requestMenu?.mouseX ?? 0
                }}
            >
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequest(requestMenu?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='inherit' color='request'><RequestIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText sx={{fontSize: settings.navigationFontSize}} disableTypography>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequestGroup(requestMenu?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='inherit' color='folder'><FolderIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText sx={{fontSize: settings.navigationFontSize}} disableTypography>Add Request Group</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleDupeRequest()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='inherit' sx={{ color: 'request' }} />
                    </ListItemIcon>
                    <ListItemText sx={{fontSize: settings.navigationFontSize}} disableTypography>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleDeleteRequest()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='inherit' color='error' />
                    </ListItemIcon>
                    <ListItemText sx={{fontSize: settings.navigationFontSize}} disableTypography>Delete</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    const buildRequest = (item: EditableRequest | EditableRequestGroup, depth: number) => {
        switch (item.entityType) {
            case EditableEntityType.Request:
                return <NavTreeItem
                    key={item.id}
                    item={item}
                    depth={depth}
                    type={EditableEntityType.Request}
                    acceptDropTypes={[EditableEntityType.Request, EditableEntityType.Group]}
                    onSelect={selectRequestOrGroup}
                    onMenu={showRequestMenu}
                    onMove={handleMoveRequest}
                    isDraggable={true}
                />
            case EditableEntityType.Group:
                return <NavTreeItem
                    key={item.id}
                    item={item}
                    depth={depth}
                    type={EditableEntityType.Group}
                    acceptDropTypes={[EditableEntityType.Request, EditableEntityType.Group]}
                    acceptDropAppends={true}
                    onSelect={selectRequestOrGroup}
                    onMenu={showRequestMenu}
                    onMove={handleMoveRequest}
                    isDraggable={true}
                    icon={<FolderIcon />}
                    iconColor="folder"
                    children={workspace.requests.getChildren(item.id).map((subItem) =>
                        buildRequest(subItem, depth + 1)
                    )}
                />
            default:
                return <></>
        }
    }

    // const { isOver, setNodeRef: setDropRef } = useDroppable({
    //     id: 'hdr-r',
    //     data: {
    //         acceptAppend: true,
    //         acceptReposition: false,
    //         acceptsTypes: [EditableEntityType.Request, EditableEntityType.Group],
    //         depth: 0,
    //         isHeader: true,
    //     } as DroppableData
    // })

    const SectionContent = observer(() => {
        return <>
            {
                workspace.requests.topLevelIds.map((id) =>
                    workspace.requests.get(id)
                )
                    .filter(e => e !== undefined)
                    .map(e => buildRequest(e, 1))
            }
            <RequestsMenu />
            <RequestMenu />
        </>
    })

    return props.includeHeader
        ? <TreeItem
            itemId='hdr-r'
            key='hdr-r'
            onClick={e => {
                e.preventDefault()
                e.stopPropagation()
            }}
            onFocusCapture={e => e.stopPropagation()}
            sx={{ margin: '0.5em 0 0 0', padding: 0 }}
            label={(
                <Box
                    className='nav-item'
                    typography='navigation'
                    // ref={setDropRef}
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        e.preventDefault()
                        e.stopPropagation()
                        handleSelectHeader('hdr-r', 'workspace/requests')
                    }}

                    onMouseEnter={() => {
                        setFocused(true)
                    }}

                    onMouseLeave={() => {
                        setFocused(false)
                    }}
                // sx={{ background: isOver ? dragPositionToColor(dragDrop.dragPosition) : 'default' }}
                >
                    <Box className='nav-icon-box'><SvgIcon className='nav-folder' color='request'><RequestIcon /></SvgIcon></Box>
                    <Box className='nav-node-text' typography='navigation' sx={{ flexGrow: 1 }}>
                        Requests
                    </Box>
                    <IconButton sx={{ flexGrow: 0, margin: 0, padding: 0, visibility: focused ? 'normal' : 'hidden', fontSize: settings.navigationFontSize }} onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleShowRequestsMenu(e, 'menu-requests')
                    }}>
                        <Box className='nav-icon-context'><MoreVertIcon /></Box>
                    </IconButton>
                </Box >
            )}>
            <SectionContent />
        </TreeItem >
        : <SectionContent />
})
