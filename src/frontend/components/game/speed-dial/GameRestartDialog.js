import { Button, DialogContentText } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import globalMessages from '@/i18n/globalMessages';

const messages = defineMessages('frontend.game.speedDial.GameRestartDialog', {
  dialogTitle: 'Are you sure to restart the game?',
  dialogWarning: 'This will reset the game and all its data.',
});

export default function GameRestartDialog({ dialogOpen, handleClose, handleCancel, handleValidate }) {
  const intl = useIntl();
  return (
    <Dialog disableEscapeKeyDown open={dialogOpen} onClose={handleClose}>
      <DialogTitle>{intl.formatMessage(messages.dialogTitle)}</DialogTitle>

      <DialogContent>
        <DialogContentText>{intl.formatMessage(messages.dialogWarning)}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          {intl.formatMessage(globalMessages.cancel)}
        </Button>
        <Button startIcon={<CheckIcon />} onClick={handleValidate}>
          {intl.formatMessage(globalMessages.confirm)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
