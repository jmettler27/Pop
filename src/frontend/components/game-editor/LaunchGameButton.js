import { launchGame } from '@/backend/services/edit-game/actions';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';
import { useParams, useRouter } from 'next/navigation';

import { useState } from 'react';

import globalMessages from '@/i18n/globalMessages';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

const messages = defineMessages('frontend.gameEditor.LaunchGameButton', {
  launchGame: 'Launch game',
  dialogTitle: 'Are you sure you want to launch this game?',
  dialogWarning: 'The game will be publicly accessible for all users.',
  dialogConfirm: 'Letzgo',
});

export function LaunchGameButton() {
  const intl = useIntl();
  const { id: gameId } = useParams();

  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [handleLaunchGame, isLaunching] = useAsyncAction(async () => {
    await launchGame(gameId);
    router.push(`/${gameId}`);
  });

  const onCancel = () => {
    setDialogOpen(false);
  };
  const onDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Button
        variant="contained"
        color="warning"
        size="large"
        className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          fontWeight: 'bold',
        }}
        startIcon={<RocketLaunchIcon />}
        onClick={() => setDialogOpen(true)}
      >
        {intl.formatMessage(messages.launchGame)}
      </Button>

      <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
        <DialogTitle>{intl.formatMessage(messages.dialogTitle)}</DialogTitle>

        <DialogContent>
          <DialogContentText>{intl.formatMessage(messages.dialogWarning)}</DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleLaunchGame} disabled={isLaunching}>
            {intl.formatMessage(messages.dialogConfirm)}
          </Button>

          <Button variant="outlined" color="error" onClick={onCancel}>
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
