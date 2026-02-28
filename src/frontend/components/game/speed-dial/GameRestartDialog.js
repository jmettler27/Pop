import { Button, DialogContentText } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

export default function GameRestartDialog({ dialogOpen, handleClose, handleCancel, handleValidate }) {
  return (
    <Dialog disableEscapeKeyDown open={dialogOpen} onClose={handleClose}>
      <DialogTitle>Are you sure to restart the game?</DialogTitle>

      <DialogContent>
        <DialogContentText>This will reset the game and all its data.</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
        <Button startIcon={<CheckIcon />} onClick={handleValidate}>
          Validate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
