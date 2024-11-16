import { observer } from "mobx-react-lite"
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import PostAddIcon from '@mui/icons-material/PostAdd'
import SaveIcon from '@mui/icons-material/Save'
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SaveAsIcon from '@mui/icons-material/SaveAs'
import HelpIcon from '@mui/icons-material/Help'
import SendIcon from '@mui/icons-material/Send'
import LockIcon from '@mui/icons-material/Lock'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import AirlineStopsIcon from '@mui/icons-material/AirlineStops';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import SdCardAlertIcon from '@mui/icons-material/SdCardAlert';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import DeleteIcon from '@mui/icons-material/DeleteOutlined'
import LanguageIcon from '@mui/icons-material/Language'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'
import { alpha, Box, Button, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, MenuProps, Stack, styled, useTheme } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import React, { ReactNode, SyntheticEvent, useState } from 'react'
import { DndContext, DragEndEvent, useDraggable, useDroppable, useSensors, useSensor, PointerSensor, DragCancelEvent, DragMoveEvent } from '@dnd-kit/core'
import { GetTitle, Persistence } from '@apicize/lib-typescript';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';
import { EditableItem } from "../models/editable";
import { EditableEntityType } from "../models/workbook/editable-entity-type";
import { useFileOperations } from "../contexts/file-operations.context";
import { useWorkspace } from "../contexts/workspace.context";
import { ToastSeverity, useFeedback } from "../contexts/feedback.context";
import { EditableWorkbookRequest } from "../models/workbook/editable-workbook-request";
import { EditableWorkbookScenario } from "../models/workbook/editable-workbook-scenario";
import { EditableWorkbookAuthorization } from "../models/workbook/editable-workbook-authorization";
import { EditableWorkbookCertificate } from "../models/workbook/editable-workbook-certificate";
import { EditableWorkbookProxy } from "../models/workbook/editable-workbook-proxy";
import { useApicizeSettings } from "../contexts/apicize-settings.context";

interface MenuPosition {
    id: string
    mouseX: number
    mouseY: number
}

enum StateIcon {
    None,
    Running,
    Private,
    Shared
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

export const Navigation = observer((props: { onSettings?: () => void }) => {

    const theme = useTheme()
    const workspace = useWorkspace()
    const fileOps = useFileOperations()
    const feedback = useFeedback()
    const settings = useApicizeSettings()

    const [requestsMenu, setRequestsMenu] = useState<MenuPosition | undefined>(undefined)
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
                            const r = workspace.active as EditableWorkbookRequest
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


    enum DragPosition {
        None = 'NONE',
        Left = 'LEFT',
        Upper = 'UPPER',
        Lower = 'LOWER',
        Invalid = 'INVALID'
    }

    const [dragPosition, setDragPosition] = useState(DragPosition.None)

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

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        })
    )

    interface DraggableData {
        type: EditableEntityType,
        move: (destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => void
    }

    interface DroppableData {
        isHeader: boolean
        acceptsType: EditableEntityType
        depth: number
    }

    function NavTreeSection(props: {
        children?: ReactNode | undefined
        type: EditableEntityType
        title: string
        helpTopic: string
        onAdd: () => void
    }) {
        const { isOver, setNodeRef: setDropRef } = useDroppable({
            id: `hdr-${props.type}`,
            data: {
                isHeader: true,
                acceptsType: props.type
            } as DroppableData
        })

        return (<TreeItem
            itemId={`hdr-${props.type}`}
            key={`hdr-${props.type}`}
            id={`hdr-${props.type}`}
            onClick={e => handleSelectHeader(e, props.helpTopic)}
            onFocusCapture={e => e.stopPropagation()}
            sx={{ margin: 0, padding: 0 }}
            label={(
                <Box
                    component='span'
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                    ref={setDropRef}
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        handleSelectHeader(e, props.helpTopic)
                    }}
                    sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default' }}
                >
                    {
                        props.type === (EditableEntityType.Request || EditableEntityType.Group) ? (<SendIcon className='nav-folder' color='request' />) :
                            props.type === EditableEntityType.Scenario ? (<LanguageIcon className='nav-folder' color='scenario' />) :
                                props.type === EditableEntityType.Authorization ? (<LockIcon className='nav-folder' color='authorization' />) :
                                    props.type === EditableEntityType.Certificate ? (<SecurityIcon className='nav-folder' color='certificate' />) :
                                        props.type === EditableEntityType.Proxy ? (<AirlineStopsIcon className='nav-folder' color='proxy' />) :
                                            (<></>)
                    }
                    <Box className='nav-node-text' sx={{ flexGrow: 1 }}>
                        {props.title}
                    </Box>
                    {
                        props.type === EditableEntityType.Request ?
                            (
                                <IconButton sx={{ flexGrow: 0, minHeight: '1em' }} onClick={(e) => handleShowRequestsMenu(e, 'menu-auth')}>
                                    <MoreVertIcon />
                                </IconButton>
                            )
                            :
                            (
                                <IconButton sx={{ flexGrow: 0, minHeight: '1em' }}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        props.onAdd()
                                    }}>
                                    <AddIcon />
                                </IconButton>
                            )
                    }
                </Box>
            )}>
            {props.children}
        </TreeItem>
        )
    }

    const NavTreeItem = observer((props: {
        type: EditableEntityType,
        item: EditableItem,
        depth: number,
        // onSelect?: (id: string) => void,
        onMenu?: (event: React.MouseEvent, id: string) => void,
        onMove?: (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => void
    }) => {
        const { attributes, listeners, setNodeRef: setDragRef, transform } = useDraggable({
            id: `${props.item.id}`,
            data: {
                type: props.type,
                move: (destinationID: string, onLowerHalf: boolean, onLeft: boolean) => {
                    if (props.onMove) {
                        props.onMove(`${props.item.id}`, destinationID, onLowerHalf, onLeft)
                    }
                }
            } as DraggableData
        })

        const iconFromStateIcon = (state: StateIcon) => {
            switch (state) {
                case StateIcon.Running:
                    return <PlayArrowIcon color="success" />
                case StateIcon.Private:
                    return <SdCardAlertIcon color="private" />
                case StateIcon.Shared:
                    return <FolderSharedIcon color="global" />
                default:
                    return null
            }
        }

        const dragStyle = {
            transform: CSS.Translate.toString(transform)
        }

        const { isOver, setNodeRef: setDropRef } = useDroppable({
            id: props.item.id,
            data: {
                isHeader: false,
                acceptsType: props.type,
                depth: props.depth
            } as DroppableData
        })

        // Requests can be hierarchical
        let children: EditableItem[] | undefined
        let stateIcon: StateIcon = StateIcon.None

        if (props.item.entityType === EditableEntityType.Group) {
            const childIds = workspace.workspace.requests.childIds?.get(props.item.id)
            children = childIds?.map(id =>
                workspace.workspace.requests.entities.get(id)
            )?.filter(e => e !== undefined)
            if (workspace.executingRequestIDs.indexOf(props.item.id) !== -1) {
                stateIcon = StateIcon.Running
            }
        } else if (props.item.entityType === EditableEntityType.Request) {
            if (workspace.executingRequestIDs.indexOf(props.item.id) !== -1) {
                stateIcon = StateIcon.Running
            }
        } else if (props.item.entityType === EditableEntityType.Scenario) {
            const scenario = props.item as EditableWorkbookScenario
            if (scenario.persistence === Persistence.Private) {
                stateIcon = StateIcon.Private
            } else if (scenario.persistence === Persistence.Global) {
                stateIcon = StateIcon.Shared
            }
        } else if (props.item.entityType === EditableEntityType.Authorization) {
            const auth = props.item as EditableWorkbookAuthorization
            if (auth.persistence === Persistence.Private) {
                stateIcon = StateIcon.Private
            } else if (auth.persistence === Persistence.Global) {
                stateIcon = StateIcon.Shared
            }
        } else if (props.item.entityType === EditableEntityType.Certificate) {
            const cert = props.item as EditableWorkbookCertificate
            if (cert.persistence === Persistence.Private) {
                stateIcon = StateIcon.Private
            } else if (cert.persistence === Persistence.Global) {
                stateIcon = StateIcon.Shared
            }
        } else if (props.item.entityType === EditableEntityType.Proxy) {
            const proxy = props.item as EditableWorkbookProxy
            if (proxy.persistence === Persistence.Private) {
                stateIcon = StateIcon.Private
            } else if (proxy.persistence === Persistence.Global) {
                stateIcon = StateIcon.Shared
            }
        }

        return children
            ?
            (
                <TreeItem
                    itemId={`${props.item.entityType}-${props.item.id}`}
                    key={props.item.id}
                    {...listeners}
                    {...attributes}
                    sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default', margin: 0, padding: 0 }}
                    // Add a selected class so that we can mark expandable tree items as selected and have them show up properly
                    className={workspace.active?.id === props.item.id ? 'selected' : ''}
                    label={(
                        <Box
                            key={`lbl-${props.item.id}`}
                            id={`lbl-${props.item.id}`}
                            ref={useCombinedRefs(setDragRef, setDropRef)}
                            style={dragStyle}
                            component='span'
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                            onClick={(e) => {
                                // Override click behavior to set active item, but not to propogate upward
                                // because we don't want to toggle expansion on anything other than the
                                // lefticon click
                                workspace.changeActive(props.item.entityType, props.item.id)
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                        >
                            <FolderIcon className='nav-folder' color='folder' />
                            <Box
                                className='nav-node-text'
                                justifyContent='left'
                                justifyItems='center'
                                display='flex'
                            >                                {GetTitle(props.item)}
                                <Box display='inline-flex' width='2em' paddingLeft='1em' justifyItems='center' justifyContent='left'>
                                    {iconFromStateIcon(stateIcon)}
                                </Box>
                            </Box>
                            <IconButton
                                sx={{
                                    visibility: props.item.id === workspace.active?.id ? 'normal' : 'hidden'
                                }}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (props.onMenu) props.onMenu(e, props.item.id)
                                }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        </Box>
                    )}>
                    {children.map(c => (
                        <NavTreeItem
                            type={props.type}
                            key={`csub-${c.id}`}
                            depth={props.depth + 1}
                            item={c}
                            // onSelect={props.onSelect}
                            onMenu={props.onMenu}
                            onMove={props.onMove}
                        />
                    ))}
                </TreeItem>
            )
            :
            (
                <TreeItem
                    itemId={`${props.type}-${props.item.id}`}
                    key={props.item.id}
                    ref={useCombinedRefs(setDragRef, setDropRef)}
                    style={dragStyle}
                    {...listeners}
                    {...attributes}
                    // onSelect={(e) => {
                    //     if (props.onSelect) props.onSelect(props.item.id)
                    // }}
                    // !!! xxx !!!!
                    // onClick={(e) => {
                    //     e.preventDefault()
                    //     e.stopPropagation()
                    //     if (props.onSelect) props.onSelect(props.item.id)
                    // }}
                    // onFocusCapture={e => e.stopPropagation()}
                    sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default', margin: 0, padding: 0 }}
                    label={(
                        <Box
                            component='span'
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                        // onFocusCapture={e => e.stopPropagation()}
                        >
                            {
                                Array.isArray(children)
                                    ? <FolderIcon color='folder' sx={{ flexGrow: 0, marginRight: '0.8em' }} />
                                    : null
                            }
                            <Box
                                className='nav-node-text'
                                justifyContent='left'
                                justifyItems='center'
                                display='flex'
                            >
                                {
                                    props.item.invalid ? (<WarningAmberIcon color='warning' sx={{ marginRight: '0.25em' }} />) : null
                                }
                                {GetTitle(props.item)}
                                <Box display='inline-flex' width='2em' paddingLeft='1em' justifyItems='center' justifyContent='left'>
                                    {iconFromStateIcon(stateIcon)}
                                </Box>
                            </Box>
                            <IconButton
                                sx={{
                                    visibility: props.item.id === workspace.active?.id ? 'normal' : 'hidden'
                                }}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (props.onMenu) props.onMenu(e, props.item.id)
                                }}
                            >
                                <MoreVertIcon />
                            </IconButton>
                        </Box>
                    )} />
            )
    })

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
        event.preventDefault()
        event.stopPropagation()
        setRequestsMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowRequestMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setReqMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowScenarioMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setScenarioMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowAuthMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setAuthMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowCertMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setCertMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
            }
        )
    }

    const handleShowProxyMenu = (event: React.MouseEvent, id: string) => {
        event.preventDefault()
        event.stopPropagation()
        setProxyMenu(
            {
                id,
                mouseX: event.clientX - 1,
                mouseY: event.clientY - 6,
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

    const handleSelectHeader = (e: SyntheticEvent, helpTopic?: string) => {
        e.preventDefault()
        e.stopPropagation()
        closeAllMenus()
        if (helpTopic) {
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

    const handleAddScenario = (targetScenarioId?: string | null) => {
        closeScenarioMenu()
        workspace.addScenario(targetScenarioId)
    }

    const handleAddAuth = (targetAuthId?: string | null) => {
        closeAuthMenu()
        workspace.addAuthorization(targetAuthId)
    }
    const handleAddCert = (targetCertId?: string | null) => {
        closeCertMenu()
        workspace.addCertificate(targetCertId)
    }

    const handleAddProxy = (targetProxyId?: string | null) => {
        closeProxyMenu()
        workspace.addProxy(targetProxyId)
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
            message: `Are you are you sure you want to delete ${GetTitle(workspace.workspace.requests.entities.get(id))}?`,
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
            message: `Are you are you sure you want to delete ${GetTitle(workspace.workspace.scenarios.entities.get(id))}?`,
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
            message: `Are you are you sure you want to delete ${GetTitle(workspace.workspace.authorizations.entities.get(id))}?`,
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
            message: `Are you are you sure you want to delete ${GetTitle(workspace.workspace.certificates.entities.get(id))}?`,
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
            message: `Are you are you sure you want to delete ${GetTitle(workspace.workspace.requests.entities.get(id))}?`,
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

    const handleMoveRequest = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectRequestOrGroup(id)
        workspace.moveRequest(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveScenario = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectScenario(id)
        workspace.moveScenario(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveAuth = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectAuthorization(id)
        workspace.moveAuthorization(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveCert = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectCertificate(id)
        workspace.moveCertificate(id, destinationID, onLowerHalf, onLeft)
    }

    const handleMoveProxy = (id: string, destinationID: string | null, onLowerHalf: boolean | null, onLeft: boolean | null) => {
        selectProxy(id)
        workspace.moveProxy(id, destinationID, onLowerHalf, onLeft)
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
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequest(workspace.active?.id)}>
                    <ListItemIcon>
                        <SendIcon fontSize='small' color='request' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequestGroup(workspace.active?.id)}>
                    <ListItemIcon>
                        <FolderIcon fontSize='small' color='folder' />
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
                        <SendIcon fontSize='small' color='request' />
                    </ListItemIcon>
                    <ListItemText>Add Request</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequestGroup(workspace.active?.id)}>
                    <ListItemIcon>
                        <FolderIcon fontSize='small' color='folder' />
                    </ListItemIcon>
                    <ListItemText>Add Request Group</ListItemText>
                </MenuItem>
                <MenuItem className='navigation-menu-item' onClick={(e) => handleDupeRequest()}>
                    <ListItemIcon>
                        <ContentCopyOutlinedIcon fontSize='small' sx={{ color: theme.palette.request.light }} />
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
        return (
            <Menu
                id='scenario-menu'
                open={scenarioMenu !== undefined}
                onClose={closeScenarioMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: scenarioMenu?.mouseY ?? 0,
                    left: scenarioMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddScenario(workspace.active?.id)}>
                    <ListItemIcon>
                        <LanguageIcon fontSize='small' color='scenario' />
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
        )
    }

    function AuthMenu() {
        return (
            <Menu
                id='auth-menu'
                open={authMenu !== undefined}
                onClose={closeAuthMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: authMenu?.mouseY ?? 0,
                    left: authMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddAuth(workspace.active?.id)}>
                    <ListItemIcon>
                        <LockIcon fontSize='small' color='authorization' />
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
        )
    }

    function CertMenu() {
        return (
            <Menu
                id='cert-menu'
                open={certMenu !== undefined}
                onClose={closeCertMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: certMenu?.mouseY ?? 0,
                    left: certMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddCert(workspace.active?.id)}>
                    <ListItemIcon>
                        <LockIcon fontSize='small' color='certificate' />
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
        )
    }

    function ProxyMenu() {
        return (
            <Menu
                id='proxy-menu'
                open={proxyMenu !== undefined}
                onClose={closeProxyMenu}
                anchorReference='anchorPosition'
                anchorPosition={{
                    top: proxyMenu?.mouseY ?? 0,
                    left: proxyMenu?.mouseX ?? 0
                }}
            >
                <MenuItem onClick={(_) => handleAddProxy(workspace.active?.id)}>
                    <ListItemIcon>
                        <LanguageIcon fontSize='small' color='proxy' />
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
        )
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

        let onLowerHalf = false
        let onLeft = false

        if (overData.isHeader) {
            onLowerHalf = true
        } else if (r) {
            if (y > r.top + (r.height / 2)) onLowerHalf = true
            if (x < 72 + overData.depth * 16) onLeft = true
        }

        let position
        if (active.id === over.id) {
            position = DragPosition.None
        } else if (activeData.type === overData.acceptsType) {
            if (onLeft) {
                position = DragPosition.Left
            } else if (onLowerHalf) {
                position = DragPosition.Lower
            } else {
                position = DragPosition.Upper
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
        let onLeft = false

        if (r) {
            if (y > r.top + (r.height / 2)) onLowerHalf = true
            if (x < 72 + overData.depth * 16) onLeft = true
        }

        if (activeData.type === overData.acceptsType) {
            activeData.move(overData.isHeader ? null : over.id.toString(), onLowerHalf, onLeft)
        }
        setDragPosition(DragPosition.None)
    }

    return (
        <Stack bgcolor='navigation.main' direction='column' useFlexGap gap='0.2em' className='nav-selection-pane'>
            <Stack direction='row' bgcolor='toolbar.main' padding='0.5em 1em 0.5em 0.5em'>
                <Stack direction='row' useFlexGap gap='0.3em'>
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
                <IconButton aria-label='help' title='Help' onClick={() => { showHelp(); }} sx={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
                    <HelpIcon />
                </IconButton>
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
                    selectedItems={workspace.active ? `${workspace.active.entityType}-${workspace.active.id}` : ''}
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
                                return
                            }
                        }
                        workspace.clearActive()
                    }}
                    className='navigation-tree'
                >
                    <NavTreeSection key='nav-section-request' type={EditableEntityType.Request} title='Requests' helpTopic='requests' onAdd={() => { }}>
                        {
                            workspace.workspace.requests.topLevelIds.map((id) =>
                                workspace.workspace.requests.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        key={`sub-${e.id}`}
                                        item={e}
                                        depth={0}
                                        type={EditableEntityType.Request}
                                        // key={`nav-section-${e.id}`}
                                        // onSelect={selectRequestOrGroup}
                                        onMenu={handleShowRequestMenu}
                                        onMove={handleMoveRequest}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-scenario' type={EditableEntityType.Scenario} title='Scenarios' helpTopic='scenarios' onAdd={handleAddScenario}>
                        {
                            workspace.workspace.scenarios.topLevelIds.map((id) =>
                                workspace.workspace.scenarios.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        key={`sub-${e.id}`}
                                        depth={0}
                                        type={EditableEntityType.Scenario}
                                        // key={`nav-section-${e.id}`}
                                        // onSelect={selectScenario}
                                        onMenu={handleShowScenarioMenu}
                                        onMove={handleMoveScenario}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-auth' type={EditableEntityType.Authorization} title='Authorizations' helpTopic='authorizations' onAdd={handleAddAuth}>
                        {
                            workspace.workspace.authorizations.topLevelIds.map((id) =>
                                workspace.workspace.authorizations.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        key={`sub-${e.id}`}
                                        depth={0}
                                        type={EditableEntityType.Authorization}
                                        // key={`nav-section-${e.id}`}
                                        // onSelect={selectAuthorization}
                                        onMenu={handleShowAuthMenu}
                                        onMove={handleMoveAuth}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-cert' type={EditableEntityType.Certificate} title='Certificates' helpTopic='certificates' onAdd={handleAddCert}>
                        {
                            workspace.workspace.certificates.topLevelIds.map((id) =>
                                workspace.workspace.certificates.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        key={`sub-${e.id}`}
                                        depth={0}
                                        type={EditableEntityType.Certificate}
                                        // key={`nav-section-${e.id}`}
                                        // onSelect={selectCertificate}
                                        onMenu={handleShowCertMenu}
                                        onMove={handleMoveCert}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <NavTreeSection key='nav-section-proxy' type={EditableEntityType.Proxy} title='Proxies' helpTopic='proxies' onAdd={handleAddProxy}>
                        {
                            workspace.workspace.proxies.topLevelIds.map((id) =>
                                workspace.workspace.proxies.entities.get(id)
                            )
                                .filter(e => e !== undefined)
                                .map(e => (
                                    <NavTreeItem
                                        item={e}
                                        key={`sub-${e.id}`}
                                        depth={0}
                                        type={EditableEntityType.Proxy}
                                        // key={`nav-section-${e.id}`}
                                        // onSelect={selectProxy}
                                        onMenu={handleShowProxyMenu}
                                        onMove={handleMoveProxy}
                                    />)
                                )
                        }
                    </NavTreeSection>
                    <TreeItem
                        itemId="wkbk-defaults"
                        sx={{ margin: 0, padding: 0 }}
                        label={(
                            <Box
                                component='span'
                                display='flex'
                                justifyContent='space-between'
                                alignItems='center'
                            >
                                <SettingsIcon className='nav-folder' />
                                <Box className='nav-node-text' display='flex' flexGrow={1} paddingTop='8px' paddingBottom='8px' alignItems='center'>
                                    {
                                        workspace.workspace.defaults.invalid ? (<WarningAmberIcon sx={{ color: '#FFFF00', marginRight: '0.25em' }} />) : null
                                    }
                                    Defaults &amp; Settings
                                </Box>
                            </Box>
                        )} onClick={() => workspace.changeActive(EditableEntityType.Defaults, '')} />
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
