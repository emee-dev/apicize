// import { GetTitle } from "@apicize/lib-typescript"
// import { useDraggable, useDroppable } from "@dnd-kit/core"
// import { SvgIconPropsColorOverrides, SvgIcon, IconButton } from "@mui/material"
// import { Box } from "@mui/system"
// import { TreeItem } from "@mui/x-tree-view/TreeItem"
// import { observer } from "mobx-react-lite"
// import { useWorkspace } from "../../contexts/workspace.context"
// import { DraggableData, DroppableData } from "../../models/drag-drop"
// import { EditableItem } from "../../models/editable"
// import { EditableEntityType } from "../../models/workspace/editable-entity-type"
// import { OverridableStringUnion } from "@mui/types";

// const NavTreeItem = observer((props: {
//     type: EditableEntityType,
//     item: EditableItem,
//     depth: number,
//     isDraggable: boolean,
//     acceptDropTypes?: EditableEntityType[],
//     acceptDropAppends?: boolean,
//     icon?: JSX.Element,
//     iconColor?: OverridableStringUnion<
//         | 'inherit'
//         | 'action'
//         | 'disabled'
//         | 'primary'
//         | 'secondary'
//         | 'error'
//         | 'info'
//         | 'success'
//         | 'warning',
//         SvgIconPropsColorOverrides>,
//     children?: JSX.Element[],
//     onSelect?: (id: string) => void,
//     onMenu?: (event: React.MouseEvent, id: string) => void,
//     onMove?: (id: string, destinationID: string | null, onLowerHalf: boolean | null, isSection: boolean | null) => void
// }) => {
//     const workspace = useWorkspace()
//     const { attributes, listeners, setNodeRef: setDragRef, transform } = props.isDraggable
//         ? useDraggable({
//             id: `${props.item.id}`,
//             data: {
//                 type: props.type,
//                 move: (destinationID: string, onLowerHalf: boolean, isSection: boolean) => {
//                     if (props.onMove) {
//                         props.onMove(`${props.item.id}`, destinationID, onLowerHalf, isSection)
//                     }
//                 }
//             } as DraggableData
//         })
//         : {
//             attributes: undefined,
//             listeners: undefined,
//             setNodeRef: () => null,
//             transform: null
//         }

//     const { isOver, setNodeRef: setDropRef } = props.acceptDropTypes
//         ? useDroppable({
//             id: props.item.id,
//             data: {
//                 acceptAppend: props.acceptDropAppends === true,
//                 acceptReposition: true,
//                 acceptsTypes: props.acceptDropTypes,
//                 depth: props.depth,
//                 isHeader: false,
//             } as DroppableData
//         })
//         : { isOver: false, setNodeRef: () => null }

//     const dragStyle = {
//         transform: CSS.Translate.toString(transform)
//     }

//     return <TreeItem
//         itemId={`${props.item.entityType}-${props.item.id}`}
//         {...listeners}
//         {...attributes}
//         sx={{ background: isOver ? dragPositionToColor(dragPosition) : 'default', margin: 0, padding: 0 }}
//         onClick={(e) => {
//             e.preventDefault()
//             e.stopPropagation()
//         }}
//         // Add a selected class so that we can mark expandable tree items as selected and have them show up properly
//         // className={workspace.active?.id === props.item.id ? 'selected' : ''}
//         label={(
//             <Box
//                 key={`lbl-${props.item.id}`}
//                 id={`lbl-${props.item.id}`}
//                 ref={useCombinedRefs(setDragRef, setDropRef)}
//                 style={dragStyle}
//                 className='nav-item'

//                 onClick={(e) => {
//                     // Override click behavior to set active item, but not to propogate upward
//                     // because we don't want to toggle expansion on anything other than the
//                     // lefticon click
//                     workspace.changeActive(props.item.entityType, props.item.id)
//                     e.preventDefault()
//                     e.stopPropagation()
//                 }}
//             >
//                 {
//                     (props.icon && props.iconColor)
//                         ? <Box className='nav-icon-box'><SvgIcon fontSize='small' color={props.iconColor}>{props.icon}</SvgIcon></Box>
//                         : null
//                 }
//                 <Box
//                     className='nav-node-text'
//                     justifyContent='left'
//                     justifyItems='center'
//                     display='flex'
//                 >
//                     {GetTitle(props.item)}
//                     <Box display='inline-flex' width='2em' paddingLeft='1em' justifyItems='center' justifyContent='left'>
//                         {iconFromState(props.item.state)}
//                     </Box>
//                 </Box>
//                 {
//                     props.onMenu
//                         ? <IconButton
//                             sx={{
//                                 visibility: props.item.id === workspace.active?.id ? 'normal' : 'hidden',
//                                 margin: 0,
//                                 padding: 0
//                             }}
//                             onClick={(e) => {
//                                 e.preventDefault()
//                                 e.stopPropagation()
//                                 if (props.onMenu) props.onMenu(e, props.item.id)
//                             }}
//                         >
//                             <MoreVertIcon />
//                         </IconButton>
//                         : <></>
//                 }
//             </Box>
//         )}>
//         {
//             props.children
//         }
//     </TreeItem>
// })