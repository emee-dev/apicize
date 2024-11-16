import { useFeedback } from '@apicize/toolkit'
import { observer } from 'mobx-react-lite'
import { Box } from '@mui/material'

export const ModalBlock = observer(() => {
    const feedback = useFeedback()
    return (
        <Box top={0}
            left={0}
            width='100%'
            height='100%'
            position='absolute'
            display={feedback.modalInProgress ? 'block' : 'none'}
            className="MuiBackdrop-root MuiModal-backdrop"
            sx={{ zIndex: 99999, opacity: 1, transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms", backgroundColor: "#00000080" }} />
    )
})