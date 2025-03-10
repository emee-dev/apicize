import { Persistence } from "@apicize/lib-typescript"
import { SvgIconPropsColorOverrides, SvgIcon, IconButton } from "@mui/material"
import { Box } from "@mui/system"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import AddIcon from '@mui/icons-material/Add'
import PrivateIcon from "../../icons/private-icon"
import PublicIcon from "../../icons/public-icon"
import VaultIcon from "../../icons/vault-icon"
import { EditableItem } from "../../models/editable"
import { IndexedEntityManager } from "../../models/indexed-entity-manager"
import { EditableEntityType } from "../../models/workspace/editable-entity-type"
import { OverridableStringUnion } from "@mui/types";
import { DragPosition, DroppableData } from "../../models/drag-drop"
import { useWorkspace } from "../../contexts/workspace.context"
import { NavTreeItem } from "./nav-tree-item"
import { useDroppable } from "@dnd-kit/core"
import { observer } from "mobx-react-lite"

export function dragPositionToColor(dragPosition: DragPosition) {
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

const ParameterSubsection = observer(<T extends EditableItem>(props: {
    type: EditableEntityType,
    parameters: IndexedEntityManager<T>,
    persistence: Persistence,
    icon: JSX.Element,
    label: string,
    suffix: string,
    onSelect: (id: string) => void,
    onAdd: () => void,
    onMove: (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => void,
    onItemMenu: (event: React.MouseEvent, id: string) => void,
    onSelectHeader: (headerId: string, helpTopic?: string) => void
}) => {
    const workspace = useWorkspace()
    const dragDrop = {
        dragPosition: DragPosition.None
    }

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
        sx={{ background: isOver ? dragPositionToColor(dragDrop.dragPosition) : 'default', margin: '0 0 0 1.0em', padding: 0 }}
        label={(
            <Box
                className='nav-item'
                onClick={(e) => {
                    // Prevent label from expanding/collapsing
                    e.preventDefault()
                    e.stopPropagation()
                    props.onSelectHeader(headerId, 'parameter-storage')
                    workspace.updateExpanded(headerId, true)
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
                        workspace.updateExpanded(headerId, true)
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
})


export const ParameterSection = observer(<T extends EditableItem>(props: {
    type: EditableEntityType,
    parameters: IndexedEntityManager<T>,
    title: string,
    helpTopic: string,
    icon: JSX.Element,
    includeHeader: boolean,
    contextMenu?: JSX.Element,
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
    onSelectHeader: (headerId: string, helpTopic?: string) => void
}) => {
    const Contents = () => {
        return <>
            {props.contextMenu}
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
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Workbook, id)}
                onSelectHeader={props.onSelectHeader} />
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
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Private, id)}
                onSelectHeader={props.onSelectHeader} />
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
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Vault, id)}
                onSelectHeader={props.onSelectHeader} />
        </>
    }

    return props.includeHeader
        ? <TreeItem
            itemId={`hdr-${props.type}`}
            key={`hdr-${props.type}`}
            id={`hdr-${props.type}`}
            onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                // props.onSelectHeader(`hdr-${props.type}`, props.helpTopic)
            }}
            onFocusCapture={e => {
                e.stopPropagation()
                e.preventDefault()
            }}
            sx={{ margin: '1.0em 0 0 0', padding: 0 }}
            label={(
                <Box
                    className='nav-item'
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        e.preventDefault()
                        e.stopPropagation()
                        props.onSelectHeader(`hdr-${props.type}`, props.helpTopic)
                    }}
                >
                    <Box className='nav-icon-box'><SvgIcon color={props.iconColor} fontSize='small'>{props.icon}</SvgIcon></Box>
                    <Box className='nav-node-text' sx={{ flexGrow: 1 }}>
                        {props.title}
                    </Box>
                </Box>
            )}>
            <Contents />
        </TreeItem>
        : <Contents />
})