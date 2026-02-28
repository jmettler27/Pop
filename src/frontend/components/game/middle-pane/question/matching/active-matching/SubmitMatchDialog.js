import { submitMatch } from '@/backend/services/question/matching/actions';

import { useUserContext, useGameContext } from '@/frontend/contexts';

import { matchIsComplete } from '@/frontend/components/game/middle-pane/question/matching/gridUtils';

import globalMessages from '@/i18n/globalMessages';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useIntl } from 'react-intl';

import { useEffect, useState } from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { GameMatchingQuestion } from '@/backend/models/questions/Matching';

export default function SubmitMatchDialog({ edges, setEdges, numCols, setNewEdgeSource, answer }) {
  const intl = useIntl();
  const user = useUserContext();
  const game = useGameContext();

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (matchIsComplete(edges, numCols)) {
      setDialogOpen(true);
    }
  }, [edges]);

  const handleMatchCancel = () => {
    setEdges([]);
    setNewEdgeSource(null);
    setDialogOpen(false);
  };

  const [handleMatchValidate, isSubmitting] = useAsyncAction(async () => {
    await submitMatch(game.id, game.currentRound, game.currentQuestion, user.id, edges);
    setEdges([]); //
    setNewEdgeSource(null);
    setDialogOpen(false);
  });

  const onDialogClose = () => {
    setEdges([]);
    setNewEdgeSource(null);
    setDialogOpen(false);
  };

  return (
    <Dialog disableEscapeKeyDown open={dialogOpen} onClose={onDialogClose}>
      <DialogTitle>{intl.formatMessage(globalMessages.dialogTitle)}</DialogTitle>

      <DialogContent>
        <DialogContentText>{GameMatchingQuestion.edgesToString(edges, answer)}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          onClick={handleMatchValidate}
          disabled={isSubmitting}
        >
          {intl.formatMessage(globalMessages.dialogValidate)}
        </Button>

        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={handleMatchCancel}>
          {intl.formatMessage(globalMessages.cancel)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
