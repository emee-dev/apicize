import { Persistence } from "@apicize/lib-typescript"
import { SvgIconPropsColorOverrides, SvgIcon, IconButton } from "@mui/material"
import { Box } from "@mui/system"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import AddIcon from '@mui/icons-material/Add'
import PrivateIcon from "../../../icons/private-icon"
import PublicIcon from "../../../icons/public-icon"
import VaultIcon from "../../../icons/vault-icon"
import { EditableEntity } from "../../../models/editable"
import { EntityType } from "../../../models/workspace/entity-type"
import { OverridableStringUnion } from "@mui/types";
import { DroppableData } from "../../../models/drag-drop"
import { useWorkspace } from "../../../contexts/workspace.context"
import { NavTreeItem } from "../nav-tree-item"
import { useDroppable } from "@dnd-kit/core"
import { observer } from "mobx-react-lite"
import { useApicize } from "../../../contexts/apicize.context"
import { NavigationEntry, ParamNavigationSection } from "../../../models/navigation"
import { IndexedEntityPosition } from "../../../models/workspace/indexed-entity-position"
import { useDragDrop } from "../../../contexts/dragdrop.context"

const ParameterSubsection = observer((props: {
    type: EntityType,
    entries: NavigationEntry[],
    persistence: Persistence,
    icon: JSX.Element,
    label: string,
    onSelect: (id: string) => void,
    onAdd: () => void,
    onMove: (id: string, relativeToId: string, relativePosition: IndexedEntityPosition) => void,
    onItemMenu: (event: React.MouseEvent, id: string) => void,
    onSelectHeader: (headerId: string, helpTopic?: string) => void
}) => {
    const settings = useApicize()
    const workspace = useWorkspace()
    const dragDrop = useDragDrop()

    const { isOver, setNodeRef: setDropRef } = useDroppable({
        id: `hdr-${props.type}-${props.persistence}`,
        data: {
            acceptAppend: true,
            acceptsTypes: [props.type],
            depth: 0,
            isHeader: true,
            persistence: props.persistence,
        } as DroppableData
    })

    const headerId = `hdr-${props.type}-${props.persistence}`
    return <TreeItem
        itemId={headerId}
        key={headerId}
        id={headerId}
        onFocusCapture={e => e.stopPropagation()}
        ref={setDropRef}
        sx={{ background: isOver ? dragDrop.toBackgroundColor() : 'default', margin: '0 0 0 1.0em', padding: 0 }}
        label={(
            <Box
                className='nav-item'
                typography='navigation'
                onClick={(e) => {
                    // Prevent label from expanding/collapsing
                    e.preventDefault()
                    e.stopPropagation()
                    props.onSelectHeader(headerId, 'parameter-storage')
                    workspace.updateExpanded(headerId, true)
                }}
            >
                {props.icon}
                <Box className='nav-node-text' typography='navigation' sx={{ flexGrow: 1, minHeight: '1em' }}>
                    {props.label}
                </Box>
                <IconButton sx={{ flexGrow: 0, minHeight: '1em', padding: 0, margin: 0, fontSize: settings.navigationFontSize }}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        props.onAdd()
                        workspace.updateExpanded(headerId, true)
                    }}>
                    <Box className='nav-icon-context'>
                        <AddIcon />
                    </Box>
                </IconButton>
            </Box>
        )}
    >
        {
            props.entries.map((e) =>
                <NavTreeItem
                    type={props.type}
                    entry={e}
                    key={e.id}
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


export const ParameterSection = observer(<T extends EditableEntity>(props: {
    type: EntityType,
    parameters: ParamNavigationSection,
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
    onAdd: (relativeToId: string, relativePosition: IndexedEntityPosition, cloneFromId: string | null) => void,
    onSelect: (id: string) => void,
    onMove: (id: string, relativeToId: string, relativePosition: IndexedEntityPosition) => void,
    onItemMenu: (e: React.MouseEvent, persistence: Persistence, id: string) => void,
    onSelectHeader: (headerId: string, helpTopic?: string) => void
}) => {
    const Contents = () => {
        return <>
            {props.contextMenu}
            <ParameterSubsection
                type={props.type}
                persistence={Persistence.Workbook}
                entries={props.parameters.public}
                icon={<Box className='nav-icon-box' typography='navigation'><SvgIcon className='nav-folder' color='public'><PublicIcon /></SvgIcon></Box>}
                label="Public"
                onSelect={props.onSelect}
                onAdd={() => props.onAdd(Persistence.Workbook, IndexedEntityPosition.Under, null)}
                onMove={props.onMove}
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Workbook, id)}
                onSelectHeader={props.onSelectHeader} />
            <ParameterSubsection
                type={props.type}
                persistence={Persistence.Private}
                entries={props.parameters.private}
                icon={<Box className='nav-icon-box' typography='navigation'><SvgIcon className='nav-folder' color='private'><PrivateIcon /></SvgIcon></Box>}
                label="Private"
                onSelect={props.onSelect}
                onAdd={() => props.onAdd(Persistence.Private, IndexedEntityPosition.Under, null)}
                onMove={props.onMove}
                onItemMenu={(e, id) => props.onItemMenu(e, Persistence.Private, id)}
                onSelectHeader={props.onSelectHeader} />
            <ParameterSubsection
                type={props.type}
                persistence={Persistence.Vault}
                entries={props.parameters.vault}
                icon={<Box className='nav-icon-box' typography='navigation'><SvgIcon className='nav-folder' color='vault'><VaultIcon /></SvgIcon></Box>}
                label="Vault"
                onSelect={props.onSelect}
                onAdd={() => props.onAdd(Persistence.Vault, IndexedEntityPosition.Under, null)}
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
                    typography='navigation'
                    onClick={(e) => {
                        // Prevent label from expanding/collapsing
                        e.preventDefault()
                        e.stopPropagation()
                        props.onSelectHeader(`hdr-${props.type}`, props.helpTopic)
                    }}
                >
                    <Box className='nav-icon-box' typography='navigation'><SvgIcon color={props.iconColor} fontSize='inherit'>{props.icon}</SvgIcon></Box>
                    <Box className='nav-node-text' typography='navigation' sx={{ flexGrow: 1 }}>
                        {props.title}
                    </Box>
                </Box>
            )}>
            <Contents />
        </TreeItem>
        : <Contents />
})