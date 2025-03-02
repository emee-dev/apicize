// import { Menu, MenuItem, ListItemIcon, SvgIcon, ListItemText } from "@mui/material"
// import FolderIcon from "../../icons/folder-icon"
// import RequestIcon from "../../icons/request-icon"




// function RequestContextMenu() {
//     return (
//         <Menu
//             id='requests-menu'
//             open={requestsMenu !== undefined}
//             onClose={closeRequestsMenu}
//             anchorReference='anchorPosition'
//             anchorPosition={{
//                 top: requestsMenu?.mouseY ?? 0,
//                 left: requestsMenu?.mouseX ?? 0
//             }}
//         >
//             <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequest()}>
//                 <ListItemIcon>
//                     <SvgIcon fontSize='small' color='request'><RequestIcon /></SvgIcon>
//                 </ListItemIcon>
//                 <ListItemText>Add Request</ListItemText>
//             </MenuItem>
//             <MenuItem className='navigation-menu-item' onClick={(_) => handleAddRequestGroup()}>
//                 <ListItemIcon>
//                     <SvgIcon fontSize='small' color='folder'><FolderIcon /></SvgIcon>
//                 </ListItemIcon>
//                 <ListItemText>Add Group</ListItemText>
//             </MenuItem>
//         </Menu>
//     )
// }

// function RequestMenu() {
//     return (
//         <Menu
//             id='req-menu'
//             open={reqMenu !== undefined}
//             onClose={closeRequestMenu}
//             anchorReference='anchorPosition'
//             anchorPosition={{
//                 top: reqMenu?.mouseY ?? 0,
//                 left: reqMenu?.mouseX ?? 0
//             }}
//         >
//             <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequest(workspace.active?.id)}>
//                 <ListItemIcon>
//                     <SvgIcon fontSize='small' color='request'><RequestIcon /></SvgIcon>
//                 </ListItemIcon>
//                 <ListItemText>Add Request</ListItemText>
//             </MenuItem>
//             <MenuItem className='navigation-menu-item' onClick={(e) => handleAddRequestGroup(workspace.active?.id)}>
//                 <ListItemIcon>
//                     <SvgIcon fontSize='small' color='folder'><FolderIcon /></SvgIcon>
//                 </ListItemIcon>
//                 <ListItemText>Add Request Group</ListItemText>
//             </MenuItem>
//             <MenuItem className='navigation-menu-item' onClick={(e) => handleDupeRequest()}>
//                 <ListItemIcon>
//                     <ContentCopyOutlinedIcon fontSize='small' sx={{ color: 'request' }} />
//                 </ListItemIcon>
//                 <ListItemText>Duplicate</ListItemText>
//             </MenuItem>
//             <MenuItem className='navigation-menu-item' onClick={(e) => handleDeleteRequest()}>
//                 <ListItemIcon>
//                     <DeleteIcon fontSize='small' color='error' />
//                 </ListItemIcon>
//                 <ListItemText>Delete</ListItemText>
//             </MenuItem>
//         </Menu>
//     )
// }
