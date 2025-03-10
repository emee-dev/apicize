import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

export function EditorTitle(props: { name: string, icon: JSX.Element, children?: ReactNode }) {
    return (
        <Typography variant='h1' className='editor-title' aria-label={props.name} component='div' display='flex' alignItems='center'  sx={{margin: 0}}>
            <div className='icon'>{props.icon}</div><Box className='text'>{props.name?.length ?? 0 > 0 ? props.name : '(Unnamed)'}</Box>
            {props.children}
        </Typography>
    )
}