import { observer } from "mobx-react-lite"
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileOpenIcon from '@mui/icons-material/FileOpen'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SaveIcon from '@mui/icons-material/Save'
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveAsIcon from '@mui/icons-material/SaveAs'
import HelpIcon from '@mui/icons-material/Help'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { alpha, Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, MenuProps, Stack, styled, SvgIcon, SvgIconPropsColorOverrides, useTheme } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import React, { SyntheticEvent, useState } from 'react'
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensors, useSensor, PointerSensor, DragCancelEvent, DragMoveEvent } from '@dnd-kit/core'
import { GetTitle, IndexedEntityManager, Persistence } from '@apicize/lib-typescript';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';
import { EditableItem, EditableState } from "../models/editable";
import { EditableEntityType } from "../models/workspace/editable-entity-type";
import { useFileOperations } from "../contexts/file-operations.context";
import { useWorkspace } from "../contexts/workspace.context";
import { ToastSeverity, useFeedback } from "../contexts/feedback.context";
import { EditableRequest, EditableRequestGroup } from "../models/workspace/editable-request";
import { useApicizeSettings } from "../contexts/apicize-settings.context";
import VaultIcon from '../icons/vault-icon'
import ScenarioIcon from "../icons/scenario-icon";
import AuthIcon from "../icons/auth-icon";
import CertificateIcon from "../icons/certificate-icon";
import RequestIcon from "../icons/request-icon";
import ProxyIcon from "../icons/proxy-icon";
import DefaultsIcon from "../icons/defaults-icon";
import PrivateIcon from "../icons/private-icon";
import PublicIcon from "../icons/public-icon";
import FolderIcon from "../icons/folder-icon";
import { DraggableData, DragPosition, DroppableData } from "../models/drag-drop";
import { OverridableStringUnion } from "@mui/types";
import LogIcon from "../icons/log-icon";

interface MenuPosition {
    id: string
    mouseX: number
    mouseY: number
    persistence: Persistence
}

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 180,
        color: 'rgb(55, 65, 81)',
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0',
        },
        '& .MuiMenuItem-root': {
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5),
            },
            '&:active': {
                backgroundColor: alpha(
                    theme.palette.primary.main,
                    theme.palette.action.selectedOpacity
                ),
            },
        },
        ...theme.applyStyles('dark', {
            color: theme.palette.grey[300],
        }),
    },
}));

export const Navigation = observer(() => {

    const theme = useTheme()
    const workspace = useWorkspace()
    const fileOps = useFileOperations()
    const feedback = useFeedback()
    const settings = useApicizeSettings()

    const [requestsMenu, setRequestsMenu] = useState<MenuPosition | undefined>()
    const [reqMenu, setReqMenu] = useState<MenuPosition | undefined>(undefined)
    const [authMenu, setAuthMenu] = useState<MenuPosition | undefined>(undefined)
    const [scenarioMenu, setScenarioMenu] = useState<MenuPosition | undefined>(undefined)
    const [certMenu, setCertMenu] = useState<MenuPosition | undefined>(undefined)
    const [proxyMenu, setProxyMenu] = useState<MenuPosition | undefined>(undefined)
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const fileMenuOpen = Boolean(anchorEl);
    const handleFileMenuClick = () => {
        const target = document.getElementById('file-menu-button')
        setAnchorEl(target);
        document.getElementById('nav-file-0')?.focus()
    };
    const handleFileOpen = (fileName: string) => {
        setAnchorEl(null);
        fileOps.openWorkbook(fileName)
    }
    const handleFileMenuClose = () => {
        setAnchorEl(null);
    };

    window.onkeydown = ((e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'Enter':
                    (async () => {
                        try {
                            if (!(workspace.active && (workspace.active.entityType === EditableEntityType.Request || workspace.active.entityType === EditableEntityType.Group))) {
                                return
                            }
                            const r = workspace.active as EditableRequest
                            await workspace.executeRequest(workspace.active.id, e.shiftKey ? r.runs : 1)
                        } catch (e) {
                            let msg1 = `${e}`
                            feedback.toast(msg1, msg1 == 'Cancelled' ? ToastSeverity.Warning : ToastSeverity.Error)
                        }
                    })()
                    break
                case 'n':
                    fileOps.newWorkbook()
                    break
                // case 'O':
                //     TODO - need to work on making recent file drop down keyboard-friendly
                //     handleFileMenuClick()
                //     break
                case 'o':
                    if (e.shiftKey) {
                        handleFileMenuClick()
                    } else {
                        fileOps.openWorkbook()
                    }
                    break
                case 's':
                    if (e.shiftKey) {
                        fileOps.saveWorkbookAs()
                    } else {
                        fileOps.saveWorkbook()
                    }
                    break
            }
        }
    })


    const [dragPosition, setDragPosition] = useState(DragPosition.None)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    )

    const clearAllSelections = () => {
        workspace.clearActive()
    }

    const closeRequestsMenu = () => {
        setRequestsMenu(undefined)
    }

    const closeRequestMenu = () => {
        setReqMenu(undefined)
    }

    const closeScenarioMenu = () => {
        setScenarioMenu(undefined)
    }

    const closeAuthMenu = () => {
        setAuthMenu(undefined)
    }

    const closeCertMenu = () => {
        setCertMenu(undefined)
    }

    const closeProxyMenu = () => {
        setProxyMenu(undefined)
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
        setReqMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence: Persistence.Workbook,
            }
        )
    }

    const showScenarioMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setScenarioMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence,
            }
        )
    }

    const showAuthMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setAuthMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence,
            }
        )
    }

    const showCertMenu = (event: React.MouseEvent, persistence: Persistence, id: string) => {
        setCertMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
                persistence,
            }
        )
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

    const closeAllMenus = () => {
        closeRequestsMenu()
        closeRequestMenu()
        closeScenarioMenu()
        closeAuthMenu()
        closeCertMenu()
        closeProxyMenu()
    }

    const handleSelectHeader = (e: SyntheticEvent, headerId: string, helpTopic?: string) => {
        e.preventDefault()
        e.stopPropagation()
        closeAllMenus()
        if (helpTopic) {
            workspace.toggleExpanded(headerId, true)
            workspace.showHelp(helpTopic)
        }
    }

    const showHelp = () => {
        closeAllMenus()
        workspace.showNextHelpTopic()
    }

    const selectRequestOrGroup = (id: string) => {
        workspace.changeActive(EditableEntityType.Request, id)
    }

    const selectScenario = (id: string) => {
        workspace.changeActive(EditableEntityType.Scenario, id)
    }

    const selectAuthorization = (id: string) => {
        workspace.changeActive(EditableEntityType.Authorization, id)
    }

    const selectCertificate = (id: string) => {
        workspace.changeActive(EditableEntityType.Certificate, id)
    }

    const selectProxy = (id: string) => {
        workspace.changeActive(EditableEntityType.Proxy, id)
    }

    const handleAddRequest = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspace.addRequest(targetRequestId)
    }

    const handleAddRequestGroup = (targetRequestId?: string | null) => {
        closeRequestsMenu()
        closeRequestMenu()
        workspace.addGroup(targetRequestId)
    }

    const handleAddScenario = (persistence: Persistence, targetScenarioId?: string | null) => {
        closeScenarioMenu()
        workspace.addScenario(persistence, targetScenarioId)
    }

    const handleAddAuth = (persistence: Persistence, targetAuthId?: string | null) => {
        closeAuthMenu()
        workspace.addAuthorization(persistence, targetAuthId)
    }
    const handleAddCert = (persistence: Persistence, targetCertId?: string | null) => {
        closeCertMenu()
        workspace.addCertificate(persistence, targetCertId)
    }

    const handleAddProxy = (persistence: Persistence, targetProxyId?: string | null) => {
        closeProxyMenu()
        workspace.addProxy(persistence, targetProxyId)
    }

    const handleDeleteRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if (!workspace.active?.id || (workspace.active?.entityType !== EditableEntityType.Request
            && workspace.active?.entityType !== EditableEntityType.Group
        )) return
        const id = workspace.active?.id
        feedback.confirm({
            title: 'Delete Request',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.requests.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspace.deleteRequest(id)
            }
        })
    }

    const handleDeleteScenario = () => {
        closeScenarioMenu()
        if (!workspace.active?.id || workspace.active?.entityType !== EditableEntityType.Scenario) return
        const id = workspace.active?.id
        feedback.confirm({
            title: 'Delete Scenario',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.scenarios.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspace.deleteScenario(id)
            }
        })
    }

    const handleDeleteAuth = () => {
        closeAuthMenu()
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
                clearAllSelections()
                workspace.deleteAuthorization(id)
            }
        })
    }

    const handleDeleteCert = () => {
        closeCertMenu()
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
                clearAllSelections()
                workspace.deleteCertificate(id)
            }
        })
    }
    const handleDeleteProxy = () => {
        closeProxyMenu()
        if (!workspace.active?.id || workspace.active?.entityType !== EditableEntityType.Proxy) return
        const id = workspace.active?.id
        feedback.confirm({
            title: 'Delete Proxy',
            message: `Are you are you sure you want to delete ${GetTitle(workspace.proxies.get(id))}?`,
            okButton: 'Yes',
            cancelButton: 'No',
            defaultToCancel: true
        }).then((result) => {
            if (result) {
                clearAllSelections()
                workspace.deleteProxy(id)
            }
        })
    }

    const handleDupeRequest = () => {
        closeRequestMenu()
        closeRequestsMenu()
        if ((workspace.active?.entityType === EditableEntityType.Request || workspace.active?.entityType === EditableEntityType.Group)
            && workspace.active?.id) workspace.copyRequest(workspace.active?.id)
    }

    const handleDupeScenario = () => {
        closeScenarioMenu()
        if (workspace.active?.entityType === EditableEntityType.Scenario && workspace.active?.id) workspace.copyScenario(workspace.active?.id)
    }

    const handleDupeAuth = () => {
        closeAuthMenu()
        if (workspace.active?.entityType === EditableEntityType.Authorization && workspace.active?.id) workspace.copyAuthorization(workspace.active?.id)
    }

    const handleDupeCert = () => {
        closeCertMenu()
        if (workspace.active?.entityType === EditableEntityType.Certificate && workspace.active?.id) workspace.copyCertificate(workspace.active?.id)
    }

    const handleDupeProxy = () => {
        closeProxyMenu()
        if (workspace.active?.entityType === EditableEntityType.Proxy && workspace.active?.id) workspace.copyProxy(workspace.active?.id)
    }

    const handleMoveRequest = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectRequestOrGroup(id)
        workspace.moveRequest(id, destinationID, onLowerHalf, isSection)
    }

    const handleMoveScenario = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectScenario(id)
        workspace.moveScenario(id, destinationID, onLowerHalf, isSection)
    }

    const handleMoveAuth = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectAuthorization(id)
        workspace.moveAuthorization(id, destinationID, onLowerHalf, isSection)
    }

    const handleMoveCert = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectCertificate(id)
        workspace.moveCertificate(id, destinationID, onLowerHalf, isSection)
    }

    const handleMoveProxy = (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => {
        selectProxy(id)
        workspace.moveProxy(id, destinationID, onLowerHalf, isSection)
    }

    function RequestsMenu() {
        return (
            <Menu
                id='requests-menu'
                open={requestsMenu !== undefined}
                onClose={closeRequestsMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: requestsMenu?.mouseY ?? 0,
                    left: requestsMenu?.mouseX ?? 0
                }}
            >
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequest()}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='request'><RequestIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequestGroup()}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='folder'><FolderIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Group</ListItemText>
                </MenuItem>
            </Menu>
        )
    }

    function RequestMenu() {
        return (
            <Menu
                id='req-menu'
                open={reqMenu !== undefined}
                onClose={closeRequestMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: reqMenu?.mouseY ?? 0,
                    left: reqMenu?.mouseX ?? 0
                }}
            >
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequest(workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='request'><RequestIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequestGroup(workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='folder'><FolderIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Request Group</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleDupeRequest()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: 'request' }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleDeleteRequest()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                </MenuItem>
            </Menu>
        )
    }


    function ScenarioMenu() {
        return scenarioMenu
            ? <Menu
                id='scenario-menu'
                open={scenarioMenu !== undefined}
                onClose={closeScenarioMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: scenarioMenu?.mouseY ?? 0,
                    left: scenarioMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddScenario(scenarioMenu.persistence, workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='scenario'><ScenarioIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Scenario</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeScenario()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.scenario.light }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate Scenario</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteScenario()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete Scenario</ListItemText>
                </MenuItem>
            </Menu>
            : <></>
    }

    function AuthMenu() {
        return authMenu
            ? <Menu
                id='auth-menu'
                open={authMenu !== undefined}
                onClose={closeAuthMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: authMenu.mouseY,
                    left: authMenu.mouseX
                }}
            >
                <MenuItem onClick={(_) => handleAddAuth(authMenu.persistence, workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='authorization'><AuthIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Authorization</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeAuth()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.authorization.light }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate Authorization</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteAuth()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete Authorization</ListItemText>
                </MenuItem>
            </Menu>
            : <></>
    }

    function CertMenu() {
        return certMenu
            ? <Menu
                id='cert-menu'
                open={certMenu !== undefined}
                onClose={closeCertMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: certMenu.mouseY,
                    left: certMenu.mouseX
                }}
            >
                <MenuItem onClick={(_) => handleAddCert(certMenu.persistence, workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='certificate'><CertificateIcon /></SvgIcon>
                    </ListItemIcon>
                    <ListItemText>Add Certificate</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDupeCert()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.certificate.light }} />
                    </ListItemIcon>
                    <ListItemText>Duplicate Certificate</ListItemText>
                </MenuItem>
                <MenuItem onClick={(e) => handleDeleteCert()}>
                    <ListItemIcon>
                        <DeleteIcon fontSize='small' color='error' />
                    </ListItemIcon>
                    <ListItemText>Delete Certificate</ListItemText>
                </MenuItem>
            </Menu>
            : <></>
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
                <MenuItem onClick={(_) => handleAddProxy(proxyMenu.persistence, workspace.active?.id)}>
                    <ListItemIcon>
                        <SvgIcon fontSize='small' color='proxy'><ScenarioIcon /></SvgIcon>
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

    const onDragCancel = (e: DragCancelEvent) => {
        setDragPosition(DragPosition.None)
    }

    const onDragMove = (e: DragMoveEvent) => {
        const { activatorEvent, delta, active, over } = e
        if (!over) return

        const pointer = activatorEvent as unknown as any
        const activeData = active.data.current as unknown as DraggableData
        const overData = over.data.current as unknown as DroppableData
        let evtDelta = delta as any

        let x = pointer.x + evtDelta.x
        let y = pointer.y + evtDelta.y

        let r = e.over?.rect

        let position = DragPosition.None
        if (active.id !== over.id) {
            if (overData.acceptsTypes.includes(activeData.type)) {
                if (overData.isHeader) {
                    if (overData.acceptAppend) {
                        position = DragPosition.Left
                    }
                } else if (overData.acceptAppend &&
                    ((!overData.acceptReposition) || x < 72 + (overData.depth + 1) * 16)) {
                    position = DragPosition.Left
                } else if (overData.acceptReposition) {
                    if (r) {
                        position = (y > r.top + (r.height / 2))
                            ? DragPosition.Lower
                            : DragPosition.Upper
                    }
                }
            }
        } else {
            position = DragPosition.Invalid
        }
        setDragPosition(position)
    }

    const onDragEnd = (e: DragEndEvent) => {
        const { activatorEvent, delta, active, over } = e
        if (!over) return

        const pointer = activatorEvent as unknown as any
        const activeData = active.data.current as unknown as DraggableData
        const overData = over.data.current as unknown as DroppableData

        let evtDelta = delta as any

        let x = pointer.x + evtDelta.x
        let y = pointer.y + evtDelta.y

        let r = e.over?.rect

        let onLowerHalf = false
        let onSection = false

        if (r) {
            if (y > r.top + (r.height / 2)) onLowerHalf = true
            if (x < 72 + overData.depth * 16) onSection = true
        }

        let id = overData.isHeader
            ? (overData.persistence ? overData.persistence : null)
            : over.id.toString()

        if (overData.isHeader && overData.persistence) {
            onSection = true
            workspace.toggleExpanded(over.id.toString(), true)
        }

        if (overData.acceptsTypes.includes(activeData.type)) {
            activeData.move(id, onLowerHalf, onSection)
        }

        setDragPosition(DragPosition.None)
    }

    const dragPositionToColor = (dragPosition: DragPosition) => {
        switch (dragPosition) {
            case DragPosition.Upper:
                return "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(128,128,128,1) 25%, rgba(64,64,64,1) 75%);"
            case DragPosition.Lower:
                return "linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(128,128,128,1) 25%, rgba(64,64,64,1) 75%);"
            case DragPosition.Left:
                return "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(128,128,128,1) 13%, rgba(64,64,64,1) 44%);"
            case DragPosition.Invalid:
                return 'rgba(128, 0, 0, 0.5)'
            default:
                return 'default'
        }
    }

    const iconFromState = (state: EditableState) => {
        switch (state) {
            case EditableState.Running:
                return <PlayArrowIcon color="success" />
            case EditableState.Warning:
                return <WarningAmberIcon color="warning" />
            default:
                return null
        }
    }

    const NavTreeItem = observer((props: {
        type: EditableEntityType,
        item: EditableItem,
        depth: number,
        isDraggable: boolean,
        acceptDropTypes?: EditableEntityType[],
        acceptDropAppends?: boolean,
        icon?: JSX.Element,
        iconColor?: OverridableStringUnion<
            | 'inherit'
            | 'action'
            | 'disabled'
            | 'primary'
            | 'secondary'
            | 'error'
            | 'info'
            | 'success'
            | 'warning',
            SvgIconPropsColorOverrides>,
        children?: JSX.Element[],
        onSelect?: (id: string) => void,
        onMenu?: (event: React.MouseEvent, id: string) => void,
        onMove?: (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => void
    }) => {
        const workspace = useWorkspace()
        const { attributes, listeners, setNodeRef: setDragRef, transform } = props.isDraggable
            ? useDraggable({
                id: `${props.item.id}`,
                data: {
                    type: props.type,
                    move: (destinationID: string, onLowerHalf: boolean, isSection: boolean) => {
                        if (props.onMove) {
                            props.onMove(`${props.item.id}`, destinationID, onLowerHalf, isSection)
                        }
                    }
                } as DraggableData
            })
            : {
                attributes: undefined,
                listeners: undefined,
                setNodeRef: () => null,
                transform: null
            }

        const { isOver, setNodeRef: setDropRef } = props.acceptDropTypes
            ? useDroppable({
                id: props.item.id,
                data: {
                    acceptAppend: props.acceptDropAppends === true,
                    acceptReposition: true,
                    acceptsTypes: props.acceptDropTypes,
                    depth: props.depth,
                    isHeader: false,
                } as DroppableData
            })
            : { isOver: false, setNodeRef: () => null }

        const dragStyle = {
            transform: CSS.Translate.toString(transform)
        }

        return <TreeItem
            itemId={`${props.item.entityType}-${props.item.id}`}
            {...listeners}
            {...attributes}
            sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default', margin: 0, padding: 0 }}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
            // Add a selected class so that we can mark expandable tree items as selected and have them show up properly
            // className={workspace.active?.id === props.item.id ? 'selected' : ''}
            label={(
                <Box
                    key={`lbl-${props.item.id}`}
                    id={`lbl-${props.item.id}`}
                    ref={useCombinedRefs(setDragRef, setDropRef)}
                    style={dragStyle}
                    className='nav-item'

                    onClick={(e) => {
                        // Override click behavior to set active item, but not to propogate upward
                        // because we don't want to toggle expansion on anything other than the
                        // lefticon click
                        workspace.changeActive(props.item.entityType, props.item.id)
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    {
                        (props.icon && props.iconColor)
                            ? <Box className='nav-icon-box'><SvgIcon fontSize='small' color={props.iconColor}>{props.icon}</SvgIcon></Box>
                            : null
                    }
                    <Box
                        className='nav-node-text'
                        justifyContent='left'
                        justifyItems='center'
                        display='flex'
                    >
                        {GetTitle(props.item)}
                        <Box display='inline-flex' width='2em' paddingLeft='1em' justifyItems='center' justifyContent='left'>
                            {iconFromState(props.item.state)}
                        </Box>
                    </Box>
                    {
                        props.onMenu
                            ? <IconButton
                                sx={{
                                    visibility: props.item.id === workspace.active?.id ? 'normal' : 'hidden',
                                    margin: 0,
                                    padding: 0
                                }}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (props.onMenu) props.onMenu(e, props.item.id)
                                }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            : <></>
                    }
                </Box>
            )}>
            {
                props.children
            }
        </TreeItem>
    })

    const RequestSection = () => {

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

        const { isOver, setNodeRef: setDropRef } = useDroppable({
            id: 'hdr-r',
            data: {
                acceptAppend: true,
                acceptReposition: false,
                acceptsTypes: [EditableEntityType.Request, EditableEntityType.Group],
                depth: 0,
                isHeader: true,
            } as DroppableData
        })

        return <TreeItem
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
                    ref={setDropRef}
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        e.preventDefault()
                        e.stopPropagation()
                        handleSelectHeader(e, 'hdr-r', 'workspace/requests')
                    }}
                    sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default' }}
                >
                    <Box className='nav-icon-box'><SvgIcon className='nav-folder' fontSize='small' color='request'><RequestIcon /></SvgIcon></Box>
                    <Box className='nav-node-text' sx={{ flexGrow: 1 }}>
                        Requests
                    </Box>
                    <IconButton sx={{ flexGrow: 0, margin: 0, padding: 0 }} onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleShowRequestsMenu(e, 'menu-requests')
                    }}>
                        <MoreVertIcon />
                    </IconButton>
                </Box >
            )}>
            {
                workspace.requests.topLevelIds.map((id) =>
                    workspace.requests.get(id)
                )
                    .filter(e => e !== undefined)
                    .map(e => buildRequest(e, 1))
            }
        </TreeItem >
    }

    function ParameterSubsection<T extends EditableItem>(props: {
        type: EditableEntityType,
        parameters: IndexedEntityManager<T>,
        persistence: Persistence,
        icon: JSX.Element,
        label: string,
        suffix: string,
        onSelect: (id: string) => void,
        onAdd: () => void,
        onMove: (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => void,
        onItemMenu: (event: React.MouseEvent, id: string) => void
    }) {
        const { isOver, setNodeRef: setDropRef } = useDroppable({
            id: `hdr-${props.type}-${props.suffix}`,
            data: {
                acceptAppend: true,
                acceptsTypes: [props.type],
                depth: 0,
                isHeader: true,
                persistence: props.persistence,
            } as DroppableData
        })

        const headerId = `hdr-${props.type}-${props.suffix}`
        return <TreeItem
            itemId={headerId}
            key={headerId}
            id={headerId}
            onFocusCapture={e => e.stopPropagation()}
            ref={setDropRef}
            sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default', margin: '0 0 0 1.0em', padding: 0 }}
            label={(
                <Box
                    className='nav-item'
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        handleSelectHeader(e, headerId, 'parameter-storage')
                        workspace.toggleExpanded(headerId, true)
                    }}
                >
                    {props.icon}
                    <Box className='nav-node-text' sx={{ flexGrow: 1, minHeight: '1em' }}>
                        {props.label}
                    </Box>
                    <IconButton sx={{ flexGrow: 0, minHeight: '1em', padding: 0, margin: 0 }}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            props.onAdd()
                        }}>
                        <AddIcon />
                    </IconButton>
                </Box>
            )}
        >
            {
                props.parameters.getChildren(props.persistence).map((e) =>
                    <NavTreeItem
                        key={e.id}
                        type={props.type}
                        item={e}
                        depth={2}
                        onSelect={props.onSelect}
                        isDraggable={true}
                        acceptDropTypes={[props.type]}
                        onMenu={props.onItemMenu}
                        onMove={props.onMove}
                    />
                )
            }
        </TreeItem >
    }

    function ParameterSection<T extends EditableItem>(props: {
        type: EditableEntityType,
        parameters: IndexedEntityManager<T>,
        title: string,
        helpTopic: string,
        icon: JSX.Element,
        iconColor: OverridableStringUnion<
            | 'inherit'
            | 'action'
            | 'disabled'
            | 'primary'
            | 'secondary'
            | 'error'
            | 'info'
            | 'success'
            | 'warning',
            SvgIconPropsColorOverrides>,
        onAdd: (persistence: Persistence) => void,
        onSelect: (id: string) => void,
        onMove: (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => void,
        onItemMenu: (e: React.MouseEvent, persistence: Persistence, id: string) => void,
    }) {
        return (<TreeItem
            itemId={`hdr-${props.type}`}
            key={`hdr-${props.type}`}
            id={`hdr-${props.type}`}
            // onClick={e => handleSelectHeader(e, `hdr-${props.type}`, props.helpTopic)}
            onFocusCapture={e => e.stopPropagation()}
            sx={{ margin: '1.0em 0 0 0', padding: 0 }}
            label={(
                <Box
                    className='nav-item'
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        handleSelectHeader(e, `hdr-${props.type}`, props.helpTopic)
                    }}
                >
                    <Box className='nav-icon-box'><SvgIcon color={props.iconColor} fontSize='small'>{props.icon}</SvgIcon></Box>
                    <Box className='nav-node-text' sx={{ flexGrow: 1 }}>
                        {props.title}
                    </Box>
                </Box>
            )}>
            <ParameterSubsection
                type={props.type}
                persistence={Persistence.Workbook}
                parameters={props.parameters}
                icon={<Box className='nav-icon-box'><SvgIcon className='nav-folder' color='public' fontSize='small'><PublicIcon /></SvgIcon></Box>}
                label="Public"
                suffix="pub"
                onSelect={props.onSelect}
                onAdd={() => props.onAdd(Persistence.Workbook)}
                onMove={props.onMove}
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Workbook, id)} />
            <ParameterSubsection
                type={props.type}
                persistence={Persistence.Private}
                parameters={props.parameters}
                icon={<Box className='nav-icon-box'><SvgIcon className='nav-folder' color='private' fontSize='small'><PrivateIcon /></SvgIcon></Box>}
                label="Private"
                suffix="priv"
                onSelect={props.onSelect}
                onAdd={() => props.onAdd(Persistence.Private)}
                onMove={props.onMove}
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Private, id)} />
            <ParameterSubsection
                type={props.type}
                persistence={Persistence.Vault}
                parameters={props.parameters}
                icon={<Box className='nav-icon-box'><SvgIcon className='nav-folder' color='vault' fontSize='small'><VaultIcon /></SvgIcon></Box>}
                label="Vault"
                suffix="vault"
                onSelect={props.onSelect}
                onAdd={() => props.onAdd(Persistence.Vault)}
                onMove={props.onMove}
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Vault, id)} />
        </TreeItem>
        )
    }

    return (
        <Stack bgcolor='navigation.main' direction='column' useFlexGap gap='0.2em' className='nav-selection-pane'>
            <Stack direction='row' bgcolor='toolbar.main' padding='0.5em 1em 0.5em 0.5em' minWidth='22em'>
                <Stack direction='row' useFlexGap gap='0.2em'>
                    <IconButton aria-label='new' title='New Workbook (Ctrl + N)' onClick={() => fileOps.newWorkbook()}>
                        <PostAddIcon />
                    </IconButton>
                    <IconButton aria-label='open' title='Open Workbook (Ctrl + O)' onClick={() => fileOps.openWorkbook(undefined, true)}>
                        <FileOpenIcon />
                    </IconButton>
                    {
                        settings.recentWorkbookFileNames.length > 1
                            ? <IconButton
                                id='file-menu-button'
                                title='Open Recent Workbook'
                                sx={{ padding: 0, minWidth: '1em', width: '1em', marginLeft: '-0.3em' }}
                                onClick={handleFileMenuClick}
                            ><KeyboardArrowDownIcon />
                            </IconButton>
                            : null
                    }
                    {
                        settings.recentWorkbookFileNames.length > 1
                            ? <StyledMenu
                                id="file-menu"
                                autoFocus
                                MenuListProps={{
                                    'aria-labelledby': 'file-menu-button',
                                }}
                                anchorEl={anchorEl}
                                open={fileMenuOpen}
                                onClose={handleFileMenuClose}
                            >
                                {
                                    settings.recentWorkbookFileNames.map((f, idx) => (
                                        <MenuItem autoFocus={idx == 0} key={`nav-file-${idx}`} onClick={() => handleFileOpen(f)} disableRipple>
                                            {`${idx + 1}) ${f}`}
                                        </MenuItem>
                                    ))
                                }
                            </StyledMenu>
                            : null
                    }
                    <IconButton aria-label='save' title='Save Workbook (Ctrl + S)' disabled={workspace.workbookFullName.length == 0} onClick={() => fileOps.saveWorkbook()}>
                        <SaveIcon />
                    </IconButton>
                    <IconButton aria-label='save' title='Save Workbook As (Ctrl + Shift + S)' onClick={() => fileOps.saveWorkbookAs()}>
                        <SaveAsIcon />
                    </IconButton>
                </Stack>
                <Box sx={{ display: 'flex', alignSelf: 'flex-end', marginLeft: 'auto', alignContent: 'right', gap: '0.2em', paddingLeft: '3em' }}>
                    <IconButton aria-label='help' title='Settings' onClick={() => { workspace.changeActive(EditableEntityType.Workbook, 'settings') }}>
                        <SettingsIcon />
                    </IconButton>
                    <IconButton aria-label='help' title='Communication Logs' onClick={() => { workspace.changeActive(EditableEntityType.Workbook, 'console') }}>
                        <SvgIcon><LogIcon /></SvgIcon>
                    </IconButton>
                    <IconButton aria-label='help' title='Help' onClick={() => { showHelp(); }}>
                        <HelpIcon />
                    </IconButton>
                </Box>
            </Stack>
            <DndContext onDragMove={onDragMove} onDragCancel={onDragCancel} onDragEnd={onDragEnd} sensors={sensors}>
                <SimpleTreeView
                    id='navigation'
                    key='navigation'
                    aria-label='request navigator'
                    // defaultCollapseIcon={<ExpandMoreIcon />}
                    // defaultExpandIcon={<ChevronRightIcon />}
                    sx={{ paddingRight: '0.8em' }}
                    expandedItems={workspace.expandedItems}
                    selectedItems={workspace.activeId}
                    multiSelect={false}
                    onItemExpansionToggle={(_, itemId, isExpanded) => {
                        workspace.toggleExpanded(itemId, isExpanded)
                    }}
                    onSelectedItemsChange={(_, itemId) => {
                        if (itemId) {
                            const i = itemId.indexOf('-')
                            if (i !== -1) {
                                const type = itemId.substring(0, i) as EditableEntityType
                                const id = itemId.substring(i + 1)
                                workspace.changeActive(type, id)
                            }
                        } else {
                            workspace.clearActive()
                        }
                    }}
                    className='navigation-tree'
                >
                    {
                        workspace.warnings.hasEntries
                            ? <TreeItem
                                itemId="wkbk-warnings"
                                sx={{ margin: '0.5em 0 1.0em 0', padding: 0 }}
                                label={(
                                    <Box
                                        component='span'
                                        display='flex'
                                        justifyContent='space-between'
                                        alignItems='center'
                                    >
                                        <Box className='nav-icon-box'>
                                            <SvgIcon color='warning' fontSize='small'><WarningAmberIcon /></SvgIcon>
                                        </Box>
                                        <Box className='nav-node-text' display='flex' flexGrow={1} alignItems='center'>
                                            Warnings
                                        </Box>
                                    </Box>
                                )} onClick={() => workspace.changeActive(EditableEntityType.Warnings, '')} />
                            : null
                    }

                    <RequestSection />

                    <ParameterSection
                        title='Scenarios'
                        icon={<ScenarioIcon />}
                        iconColor='scenario'
                        helpTopic='workspace/scenarios'
                        type={EditableEntityType.Scenario}
                        parameters={workspace.scenarios}
                        onSelect={selectScenario}
                        onAdd={handleAddScenario}
                        onMove={handleMoveScenario}
                        onItemMenu={showScenarioMenu}
                    />
                    <ParameterSection
                        title='Authorizations'
                        icon={<AuthIcon />}
                        iconColor='authorization'
                        helpTopic='workspace/authorizations'
                        type={EditableEntityType.Authorization}
                        parameters={workspace.authorizations}
                        onSelect={selectAuthorization}
                        onAdd={handleAddAuth}
                        onMove={handleMoveAuth}
                        onItemMenu={showAuthMenu}
                    />
                    <ParameterSection
                        title='Certificates'
                        icon={<CertificateIcon />}
                        iconColor='certificate'
                        helpTopic='workspace/certificates'
                        type={EditableEntityType.Certificate}
                        parameters={workspace.certificates}
                        onSelect={selectCertificate}
                        onAdd={handleAddCert}
                        onMove={handleMoveCert}
                        onItemMenu={showCertMenu}
                    />
                    <ParameterSection
                        title='Proxies'
                        icon={<ProxyIcon />}
                        iconColor='proxy'
                        helpTopic='workspace/proxies'
                        type={EditableEntityType.Proxy}
                        parameters={workspace.proxies}
                        onSelect={selectProxy}
                        onAdd={handleAddProxy}
                        onMove={handleMoveProxy}
                        onItemMenu={showProxyMenu}
                    />
                    <TreeItem
                        itemId="wkbk-defaults"
                        sx={{ margin: '1.0em 0 1.0em 0', padding: 0 }}
                        label={(
                            <Box
                                className='nav-item'
                            >
                                <Box className='nav-icon-box'>
                                    <SvgIcon color='defaults' fontSize='small'><DefaultsIcon /></SvgIcon>
                                </Box>
                                <Box className='nav-node-text' display='flex' flexGrow={1} alignItems='center'>
                                    Defaults
                                </Box>
                                <Box display='inline-flex' width='2em' paddingLeft='1em' justifyItems='center' justifyContent='left'>
                                    {iconFromState(workspace.defaults.state)}
                                </Box>
                            </Box>
                        )} />
                </SimpleTreeView>
            </DndContext>
            <RequestsMenu />
            <RequestMenu />
            <ScenarioMenu />
            <AuthMenu />
            <CertMenu />
            <ProxyMenu />
        </Stack >
    )
})
