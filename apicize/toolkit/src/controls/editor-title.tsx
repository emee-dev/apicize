import { Box, Typography } from "@mui/material";

export function EditorTitle(props: { name: string, icon: JSX.Element }) {
    return (
        <Typography variant='h1' className='editor-title' aria-label={props.name} component='div' sx={{margin: 0}}>
            {props.icon}<Box className='text'>{props.name?.length ?? 0 > 0 ? props.name : '(Unnamed)'}</Box>
        </Typography>
    )
}