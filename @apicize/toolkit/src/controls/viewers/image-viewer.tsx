import { Box } from "@mui/material"

export const KNOWN_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'tif', 'tiff']

export function ImageViewer(props: {
    base64ToRender: string | undefined,
    extensionToRender?: string
}) {
    if (props.base64ToRender && props.base64ToRender.length > 0 && props.extensionToRender && props.extensionToRender.length > 0) {
        return (
            <Box
                style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    overflow: 'auto',
                    position: 'relative',
                    marginTop: 0,
                    boxSizing: 'border-box',
                    width: '100%',
                    maxWidth: '100%',
                }}
            >
                <img
                    aria-label="response image"
                    style={{
                        position: 'absolute'
                    }}
                    src={`data:image/${props.extensionToRender};base64,${props.base64ToRender}`}
                />
            </Box>
        )
    } else {
        return (<></>)
    }

}
