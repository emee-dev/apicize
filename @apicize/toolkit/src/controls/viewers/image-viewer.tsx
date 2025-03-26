import { Box } from "@mui/material"
import { base64Encode } from "../../services/apicize-serializer"

export const KNOWN_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'bmp', 'tif', 'tiff']

export function ImageViewer(props: {
    data: Uint8Array | undefined,
    extensionToRender?: string
}) {
    if (props.data && props.data.length > 0 && props.extensionToRender && props.extensionToRender.length > 0) {
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
                    src={`data:image/${props.extensionToRender};base64,${base64Encode(props.data)}`}
                />
            </Box>
        )
    } else {
        return (<></>)
    }

}
