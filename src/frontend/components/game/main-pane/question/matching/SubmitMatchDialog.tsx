import { useEffect, useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useIntl } from 'react-intl';

import { submitMatch } from '@/backend/services/question/matching/actions';
import { matchIsComplete } from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { GameMatchingQuestion, MatchingAnswer, MatchingEdgeData } from '@/models/questions/matching';

interface SubmitMatchDialogProps {
  edges: MatchingEdgeData[];
  setEdges: React.Dispatch<React.SetStateAction<MatchingEdgeData[]>>;
  numCols: number;
  setNewEdgeSource: React.Dispatch<React.SetStateAction<string | null>>;
  answer: MatchingAnswer;
}

export default function SubmitMatchDialog({
  edges,
  setEdges,
  numCols,
  setNewEdgeSource,
  answer,
}: SubmitMatchDialogProps) {
  const intl = useIntl();
  const user = useUser();
  const game = useGame();

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (
      matchIsComplete(
        edges.map((e) => ({ sourceId: e.from, targetId: e.to })),
        numCols
      )
    ) {
      setDialogOpen(true);
    }
  }, [edges]);

  const handleMatchCancel = () => {
    setEdges([]);
    setNewEdgeSource(null);
    setDialogOpen(false);
  };

  const [handleMatchValidate, isSubmitting] = useAsyncAction(async () => {
    if (!game || !user) return;
    await submitMatch(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id,
      edges,
      null
    );
    setEdges([]);
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
          {intl.formatMessage(globalMessages.submit)}
        </Button>

        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={handleMatchCancel}>
          {intl.formatMessage(globalMessages.cancel)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
