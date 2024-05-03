import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export default function EditGameButton({ gameId }) {
    return (
        <IconButton
            color='warning'
            href={'/edit/' + gameId}
        >
            <EditIcon />
        </IconButton>
    )
}