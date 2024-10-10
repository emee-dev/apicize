import { Box, Typography } from "@mui/material";

export function EditorTitle(props: { name: string, icon: JSX.Element }) {
    return (
        <Box className='editor-title'>
            <Typography variant='h1' aria-label={props.name} component='div'>
                {props.icon}<Box className='text'>{props.name?.length ?? 0 > 0 ? props.name : '(Unnamed)'}</Box>
            </Typography>
        </Box>
    )
}