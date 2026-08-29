import { useEffect, useState } from 'react';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import { submitMatch } from '@/backend/services/question/matching/actions';
import { matchIsComplete } from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { useIsChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useRole from '@/frontend/hooks/useRole';
import useTeamId from '@/frontend/hooks/useTeamId';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameMatchingQuestion, MatchingAnswer, MatchingEdgeData } from '@/models/questions/matching';
import { ParticipantRole } from '@/models/users/participant';

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
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const teamId = useTeamId();
  const role = useRole();
  const { isChooser } = useIsChooser(gameId, teamId as string);

  const [dialogOpen, setDialogOpen] = useState(false);

  // Closes the dialog when no longer chooser (i.e. other player in team has submitted)
  const shouldAutoClose = dialogOpen && role === ParticipantRole.PLAYER && !isChooser;
  const [prevShouldAutoClose, setPrevShouldAutoClose] = useState(shouldAutoClose);
  if (shouldAutoClose !== prevShouldAutoClose) {
    setPrevShouldAutoClose(shouldAutoClose);
    if (shouldAutoClose) {
      setDialogOpen(false);
    }
  }
  // edges/setNewEdgeSource are owned by an ancestor component, so they can't be reset
  // during this component's render (React disallows updating another component's state
  // while rendering) — an effect is required here instead of the render-phase pattern above.
  useEffect(() => {
    if (shouldAutoClose) {
      setEdges([]);
      setNewEdgeSource(null);
    }
  }, [shouldAutoClose, setEdges, setNewEdgeSource]);

  const isMatchComplete = matchIsComplete(
    edges.map((e) => ({ sourceId: e.from, targetId: e.to })),
    numCols
  );
  const [prevIsMatchComplete, setPrevIsMatchComplete] = useState(isMatchComplete);
  if (isMatchComplete !== prevIsMatchComplete) {
    setPrevIsMatchComplete(isMatchComplete);
    if (isMatchComplete) {
      setDialogOpen(true);
    }
  }

  const handleMatchCancel = () => {
    setEdges([]);
    setNewEdgeSource(null);
    setDialogOpen(false);
  };

  const [handleMatchValidate, isSubmitting] = useAsyncAction(async () => {
    if (!user) return;
    await submitMatch(gameId, roundId, questionId, user.id as string, edges, null);
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
    <Dialog
      open={dialogOpen}
      onOpenChange={(open, eventDetails) => {
        if (eventDetails.reason === 'escape-key') return;
        if (!open) onDialogClose();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{intl.formatMessage(globalMessages.dialogTitle)}</DialogTitle>
          <DialogDescription>{GameMatchingQuestion.edgesToString(edges, answer)}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button onClick={handleMatchValidate} disabled={isSubmitting}>
            <CheckCircle2 className="mr-2 size-4" />
            {intl.formatMessage(globalMessages.submit)}
          </Button>

          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={handleMatchCancel}
          >
            <XCircle className="mr-2 size-4" />
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
