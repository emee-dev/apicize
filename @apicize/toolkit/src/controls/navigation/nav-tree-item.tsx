import { useDraggable, useDroppable } from "@dnd-kit/core"
import { SvgIconPropsColorOverrides, SvgIcon, IconButton } from "@mui/material"
import { Box } from "@mui/system"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import { observer } from "mobx-react-lite"
import { DraggableData, DroppableData } from "../../models/drag-drop"
import { EditableState } from "../../models/editable"
import { EditableEntityType } from "../../models/workspace/editable-entity-type"
import { OverridableStringUnion } from "@mui/types";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';
import { useState } from "react"
import { useDragDrop } from "../../contexts/dragdrop.context"
import { useApicize } from "../../contexts/apicize.context"
import { useWorkspace } from "../../contexts/workspace.context"
import { IndexedEntityPosition } from "../../models/workspace/indexed-entity-position"


const iconFromState = (state: EditableState) => {
    switch (state) {
        case EditableState.Running:
            return <PlayArrowIcon color="success" fontSize='inherit' />
        case EditableState.Warning:
            return <WarningAmberIcon color="warning" fontSize='inherit' />
        default:
            return null
    }
}

export const NavTreeItem = observer((props: {
    type: EditableEntityType,
    id: string,
    title: string,
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
    onMenu?: (event: React.MouseEvent, id: string, type: EditableEntityType) => void,
    onMove?: (id: string, relativeToId: string, relativePosition: IndexedEntityPosition) => void
}) => {
    const settings = useApicize()
    const workspace = useWorkspace()
    const dragDrop = useDragDrop()
    const itemId = `${props.type}-${props.id}`

    const [focused, setFocused] = useState<boolean>(false)

    const { attributes, listeners, setNodeRef: setDragRef, transform } = props.isDraggable
        ? useDraggable({
            id: props.id,
            data: {
                type: props.type,
                move: (relativeToId: string, relativePosition: IndexedEntityPosition) => {
                    if (props.onMove) {
                        props.onMove(props.id, relativeToId, relativePosition)
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
            id: props.id,
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
        itemId={itemId}
        {...listeners}
        {...attributes}
        sx={{ background: isOver ? dragDrop.toBackgroundColor() : 'default', margin: 0, padding: 0 }}
        onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
        }}
        // Add a selected class so that we can mark expandable tree items as selected and have them show up properly
        label={(
            <Box
                key={`lbl-${props.id}`}
                id={`lbl-${props.id}`}
                ref={useCombinedRefs(setDragRef, setDropRef)}
                style={dragStyle}
                className='nav-item'
                typography='navigation'

                onClick={(e) => {
                    // Override click behavior to set active item, but not to propogate upward
                    // because we don't want to toggle expansion on anything other than the
                    // lefticon click
                    workspace.changeActive(props.type, props.id)
                    e.preventDefault()
                    e.stopPropagation()
                }}

                onMouseEnter={() => {
                    setFocused(true)
                }}

                onMouseLeave={() => {
                    setFocused(false)
                }}
            >
                {
                    (props.icon && props.iconColor)
                        ? <Box className='nav-icon-box'><SvgIcon color={props.iconColor}>{props.icon}</SvgIcon></Box>
                        : null
                }
                <Box
                    className='nav-node-text'
                    justifyContent='left'
                    justifyItems='center'
                    display='flex'
                >
                    {props.title}
                    {/* <Box display='inline-flex' width='2em' paddingLeft='1em' justifyItems='center' justifyContent='left' typography='navigation'>
                        {iconFromState(props.item.state)}
                    </Box> */}
                </Box>
                {
                    props.onMenu
                        ? <IconButton
                            sx={{
                                visibility: focused ? 'normal' : 'hidden',
                                margin: 0,
                                padding: 0,
                                fontSize: settings.navigationFontSize
                            }}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (props.onMenu) props.onMenu(e, props.id, props.type)
                            }}
                        >
                            <Box className='nav-icon-context'><MoreVertIcon /></Box>
                        </IconButton>
                        : <></>
                }
            </Box >
        )}>
        {
            props.children
        }
    </TreeItem >
})