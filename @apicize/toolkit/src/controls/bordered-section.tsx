import React from "react";
import SvgIcon from "@mui/material/SvgIcon";
import { Box, SxProps, useTheme } from "@mui/system";

export function BorderedSection(props: { icon?: typeof SvgIcon, title?: string, children: React.ReactNode, sx?: SxProps }) {
    const theme = useTheme()
    const borderStyle = theme.palette.mode === 'dark' ? '1px solid #FFFFFF' : '1px solid #000000'

    return (
        <Box borderLeft={borderStyle} borderBottom={borderStyle} borderRight={borderStyle} borderRadius='5px' sx={props.sx}>
            <Box display='flex' flexDirection='row' width='100%'>
                <Box borderTop={borderStyle} width='1em' sx={{ borderTopLeftRadius: '5px' }}></Box>
                {(props.icon || props.title) && (
                    <Box display='flex' flexDirection='row' flexWrap='nowrap' alignItems='center' gap='0.25em' width='fit-content' height='2em'
                        margin='-1em 0.5em 0 0.5em' overflow='hidden' textOverflow='ellipsis' fontSize='1em' fontWeight='600'>
                        {props.icon && <SvgIcon component={props.icon} />}
                        {props.title && <span className='title'>{props.title}</span>}
                    </Box>
                )}
                <Box borderTop={borderStyle} width='1em' flexGrow={2} sx={{ borderTopRightRadius: '5px' }}></Box>
            </Box>
            <Box padding='1em'>{props.children}</Box>
        </Box>
    );
}
