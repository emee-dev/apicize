import { SvgIcon, IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material"
import { Box } from "@mui/system"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import FolderIcon from "../../../icons/folder-icon"
import RequestIcon from "../../../icons/request-icon"
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EditableEntityType } from "../../../models/workspace/editable-entity-type"
import { NavTreeItem } from "../nav-tree-item"
import { Persistence } from "@apicize/lib-typescript"
import { MenuPosition } from "../../../models/menu-position"
import { useState } from "react"
import { useWorkspace } from "../../../contexts/workspace.context"
import { useFeedback } from "../../../contexts/feedback.context"
import { observer } from "mobx-react-lite"
import { useApicize } from "../../../contexts/apicize.context"
import { NavigationHierarchicalEntry } from "../../../models/navigation"
import { IndexedEntityPosition } from "../../../models/workspace/indexed-entity-position"

export const RequestSection = observer((props: { includeHeader?: boolean }) => {
    const workspace = useWorkspace()
    const feedback = useFeedback()
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

    const handleShowRequestsMenu = (event: React.MouseEvent, id: string, type: EditableEntityType) => {
        setRequestsMenu(
            {
                id,
                type,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence: Persistence.Workbook,
            }
        )
    }

    const showRequestMenu = (event: React.MouseEvent, id: string, type: EditableEntityType) => {
        setRequestMenu(
            {
                id,
                type,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence: Persistence.Workbook,
            }
        )
    }

    const handleSelectHeader = (headerId: string, helpTopic?: string) => {
        // closeAllMenus()
        if (helpTopic) {
            workspace.updateExpanded(headerId, true)
            workspace.showHelp(helpTopic)
        }
    }
    const handleAddRequest = (targetRequestId: string | null, targetPosition: IndexedEntityPosition) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspace.addRequest(targetRequestId, targetPosition, null)
    }

    const handleAddRequestGroup = (targetRequestId: string | null, targetPosition: IndexedEntityPosition) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspace.addGroup(targetRequestId, targetPosition, null)
    }

    const handleDeleteRequest = (id: string, type: EditableEntityType) => {
        closeRequestMenu()
        closeRequestsMenu()

        if (id) {
            let tname: string
            switch (type) {
                case EditableEntityType.Request:
                    tname = 'Request'
                    break
                case EditableEntityType.Group:
                    tname = 'Group'
                    break
                default:
                    return
            }
            feedback.confirm({
                title: 'Delete ' + tname,
                message: `Are you are you sure you want to delete ${workspace.getNavigationName(id)}?`,
                okButton: 'Yes',
                cancelButton: 'No',
                defaultToCancel: true
            }).then((result) => {
                if (result) {
                    switch (type) {
                        case EditableEntityType.Request:
                            workspace.deleteRequest(id)
                            break
                        case EditableEntityType.Group:
                            workspace.deleteGroup(id)
                            break
                    }
                }
            })
        }
    }

    const handleMoveRequest = (id: string, relativeToId: string, relativePosition: IndexedEntityPosition) => {
        selectRequestOrGroup(id)
        workspace.moveRequest(id, relativeToId, relativePosition)
    }

    const handleDupeRequest = (id: string, type: EditableEntityType) => {
        closeRequestMenu()
        closeRequestsMenu()
        if (id) {
            switch (type) {
                case EditableEntityType.Request:
                    workspace.addRequest(id, IndexedEntityPosition.After, id)
                    break
                case EditableEntityType.Group:
                    workspace.addGroup(id, IndexedEntityPosition.After, id)
                    break
            }
        }
    }

    const selectRequestOrGroup = (id: string) => {
        workspace.changeActive(EditableEntityType.Request, id)
    }

    function RequestsMenu() {
        return (
            <Menu
                id='requests-menu'
                open={requestsMenu !== undefined}
                sx={{ fontSize: settings.navigationFontSize }}
                onClose={closeRequestsMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: requestsMenu?.mouseY ?? 0,
                    left: requestsMenu?.mouseX ?? 0
                }}
            >
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequest(null, IndexedEntityPosition.Under)} >
                    <ListItemIcon>
                        <SvgIcon fontSize='inherit' color='request'><RequestIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText sx={{ fontSize: settings.navigationFontSize }} disableTypography>Append Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequestGroup(null, IndexedEntityPosition.Under)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='inherit' color='folder'><FolderIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText sx={{ fontSize: settings.navigationFontSize }} disableTypography>Append Group</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    function RequestMenu() {
        if (!requestMenu) {
            return null
        }

        let positionType: IndexedEntityPosition
        let action: string

        if (requestMenu.type === EditableEntityType.Group) {
            positionType = IndexedEntityPosition.Under
            action = 'Add'
        } else {
            positionType = IndexedEntityPosition.Before
            action = 'Insert'
        }

        
        return <Menu
            id='req-menu'
            open={requestMenu !== undefined}
            sx={{ fontSize: settings.navigationFontSize }}
            onClose={closeRequestMenu}
            anchorReference='anchorPosition'
            anchorPosition={{
                top: requestMenu?.mouseY ?? 0,
                left: requestMenu?.mouseX ?? 0
            }}
        >
            <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequest(
                requestMenu.id,
                positionType
            )}>
                <ListItemIcon>
                    <SvgIcon fontSize='inherit' color='request'><RequestIcon /></SvgIcon>
                </ListItemIcon>
                <ListItemText sx={{ fontSize: settings.navigationFontSize }} disableTypography>{action} Request</ListItemText>
            </MenuItem>
            <MenuItem className='navigation-menu-item' onClick={(e) =>
                handleAddRequestGroup(
                    requestMenu.id,
                    positionType
                )}>
                <ListItemIcon>
                    <SvgIcon fontSize='inherit' color='folder'><FolderIcon /></SvgIcon>
                </ListItemIcon>
                <ListItemText sx={{ fontSize: settings.navigationFontSize }} disableTypography>{action} Request Group</ListItemText>
            </MenuItem>
            <MenuItem className='navigation-menu-item' onClick={(e) => handleDupeRequest(requestMenu.id, requestMenu.type)}>
                <ListItemIcon>
                    <ContentCopyOutlinedIcon fontSize='inherit' sx={{ color: 'request' }} />
                </ListItemIcon>
                <ListItemText sx={{ fontSize: settings.navigationFontSize }} disableTypography>Add Duplicate</ListItemText>
            </MenuItem>
            <MenuItem className='navigation-menu-item' onClick={(e) => handleDeleteRequest(requestMenu.id, requestMenu.type)}>
                <ListItemIcon>
                    <DeleteIcon fontSize='inherit' color='error' />
                </ListItemIcon>
                <ListItemText sx={{ fontSize: settings.navigationFontSize }} disableTypography>Delete</ListItemText>
            </MenuItem>
        </Menu>
    }

    const buildRequest = (entry: NavigationHierarchicalEntry, depth: number) => {
        return entry.children
            ? <NavTreeItem
                id={entry.id}
                key={entry.id}
                title={entry.name}
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
                children={entry.children.map((child) =>
                    buildRequest(child, depth + 1)
                )}
            />
            : <NavTreeItem
                id={entry.id}
                key={entry.id}
                title={entry.name}
                depth={depth}
                type={EditableEntityType.Request}
                acceptDropTypes={[EditableEntityType.Request, EditableEntityType.Group]}
                onSelect={selectRequestOrGroup}
                onMenu={showRequestMenu}
                onMove={handleMoveRequest}
                isDraggable={true}
            />
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
                workspace.navigation.requests.map(r => buildRequest(r, 1))
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
                        handleShowRequestsMenu(e, 'menu-requests', EditableEntityType.Group)
                    }}>
                        <Box className='nav-icon-context'><MoreVertIcon /></Box>
                    </IconButton>
                </Box >
            )}>
            <SectionContent />
        </TreeItem >
        : <SectionContent />
})
