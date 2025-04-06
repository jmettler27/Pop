
import { Button } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home';

export default function GoGameHomeButton({ onClick, disabled }) {

    return (
        <Button
            size='large'
            startIcon={<HomeIcon />}
            variant='contained'
            onClick={onClick}
            disabled={disabled}
        >
            Vers le menu principal
        </Button>
    )
}