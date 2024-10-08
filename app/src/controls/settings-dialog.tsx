// import { useApicizeSettings } from "../providers/apicize-settings.provider";
// import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputLabel, MenuItem, Select, Stack } from "@mui/material";
// import { SupportedColorScheme, useColorScheme } from "@mui/material/styles";
// import AddIcon from '@mui/icons-material/Add';
// import RemoveIcon from '@mui/icons-material/Remove';

// import { observer } from "mobx-react-lite";
// import { useState } from "react";
// import { useFileOperations } from "@apicize/toolkit";

// export const SettingsDialog = observer(() => {
//     const settings = useApicizeSettings()
//     const fileOps = useFileOperations()

//     const [canIncrease, setCanIncrease] = useState(settings.fontSize > 6)
//     const [canDecrease, setCanDecrease] = useState(settings.fontSize < 48)

//     const [origFontSize] = useState(settings.fontSize)
//     const [origColorScheme] = useState(settings.colorScheme)

//     const increase = () => {
//         if (settings.fontSize < 48) settings.fontSize = settings.fontSize + 1
//         setCanIncrease(settings.fontSize < 48)
//     }

//     const decrease = () => {
//         if (settings.fontSize > 6) settings.fontSize = settings.fontSize - 1
//         setCanDecrease(settings.fontSize > 6)
//     }

//     return (
//         <Dialog
//             open={settings.showSettings}
//             onClose={() => settings.showSettings = false}
//             aria-labelledby="settings-dialog-title"
//             aria-describedby="settings-dialog-description"
//         >
//             <DialogTitle id="settings-dialog-title">
//                 Apicize Settings
//             </DialogTitle>
//             <DialogContent sx={{
//                 paddingTop: '2em',
//                 paddingRight: '5em',
//                 paddingLeft: '5em',
//             }}>
//                 <Stack direction={'column'} spacing={'1em'} sx={{ paddingTop: '1.5em' }}>
//                     <Stack direction={'row'} spacing={'1em'}>
//                         <InputLabel id='text-size-label-id'>Text Size:</InputLabel>
//                         <IconButton onClick={() => increase()} aria-label="increase font size" disabled={!canIncrease}><AddIcon /></IconButton>
//                         <IconButton onClick={() => decrease()} aria-label="decrease font size" disabled={!canDecrease}><RemoveIcon /></IconButton>
//                         <Box>{settings.fontSize}</Box>
//                     </Stack>
//                     <Stack direction={'row'} spacing={'1em'} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
//                         <InputLabel id='color-mode-label-id'>Color Mode:</InputLabel>
//                         <Select
//                             value={settings.colorScheme}
//                             onChange={(event) => {
//                                 settings.colorScheme = event.target.value as SupportedColorScheme
//                                 // setMode(event.target.value as SupportedColorScheme)
//                             }}
//                         >
//                             <MenuItem value="light">Light</MenuItem>
//                             <MenuItem value="dark">Dark</MenuItem>
//                         </Select>
//                     </Stack>
//                 </Stack>

//             </DialogContent>
//             <DialogActions>
//                 <Box display='flex' width='100%'>
//                     <Box flexGrow={1}>
//                         <Button onClick={() => {
//                             settings.fontSize = 12
//                             settings.colorScheme = 'dark'
//                         }}>
//                             Defaults
//                         </Button>
//                     </Box>
//                     <Button onClick={() => {
//                         settings.showSettings = false
//                         fileOps.saveSettings()
//                     }}>
//                         Save
//                     </Button>
//                     <Button onClick={() => {
//                         settings.fontSize = origFontSize
//                         settings.colorScheme = origColorScheme
//                         settings.showSettings = false
//                     }}>
//                         Cancel
//                     </Button>
//                 </Box>
//             </DialogActions>
//         </Dialog>
//     )
// })