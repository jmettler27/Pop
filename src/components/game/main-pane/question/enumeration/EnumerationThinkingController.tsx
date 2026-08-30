'use client';

import { useState } from 'react';

import { useIntl } from 'react-intl';

import { questionAction } from '@/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { range } from '@/helpers/arrays';
import { useQuestionPlayers } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import useRole from '@/hooks/useRole';
import useUser from '@/hooks/useUser';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { Timer, TimerStatus } from '@/models/timer';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.EnumerationThinkingController', {
  betInputLabel: 'My bet',
  enumThinkingActiveHeader: 'Waiting for players to bet...',
});

export default function EnumerationThinkingController({
  baseQuestion,
  timer,
}: {
  baseQuestion: EnumerationQuestion;
  timer: Timer;
}) {
  const role = useRole();

  switch (role) {
    case ParticipantRole.PLAYER:
      return <EnumPlayerThinkingController baseQuestion={baseQuestion} timer={timer} />;
    default:
      return <EnumSpectatorThinkingController timer={timer} />;
  }
}

function EnumPlayerThinkingController({ baseQuestion, timer }: { baseQuestion: EnumerationQuestion; timer: Timer }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <AddBetForm baseQuestion={baseQuestion} status={timer.status} />
    </div>
  );
}

function AddBetForm({ baseQuestion, status }: { baseQuestion: EnumerationQuestion; status: TimerStatus }) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const user = useUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [myBet, setMyBet] = useState(0);
  const [hasValidated, setHasValidated] = useState(false);

  const [handleBetValidate, isSubmitting] = useAsyncAction(async () => {
    await questionAction(gameId, roundId, questionId, { action: 'add_bet', bet: Number(myBet) });
    setHasValidated(true);
    setDialogOpen(false);
  });

  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = useQuestionPlayers(gameId, roundId, questionId);

  if (playersError) {
    return <></>;
  }
  if (playersLoading) {
    return <Spinner />;
  }
  if (!questionPlayers) {
    return <></>;
  }

  const bets = (questionPlayers as { bets?: Array<{ playerId: string }> }).bets ?? [];
  const hasBet = bets.some((bet) => bet.playerId === user?.id);
  const selectorDisabled = status !== TimerStatus.START || hasValidated || hasBet;

  const handleSelectorChange = (value: number) => {
    setDialogOpen(true);
    setMyBet(value);
  };

  const handleBetCancel = () => {
    setMyBet(0);
    setDialogOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const choices = range((baseQuestion.answer ?? []).length + 1);

  return (
    <div className="flex flex-row items-center justify-center">
      <div className="group m-2 flex flex-col gap-1.5" data-disabled={selectorDisabled}>
        <Label htmlFor="enum-bet-selector-select" className="text-white">
          {intl.formatMessage(messages.betInputLabel)}
        </Label>
        <Select
          value={myBet}
          onValueChange={(value) => handleSelectorChange(value as number)}
          disabled={selectorDisabled}
        >
          <SelectTrigger id="enum-bet-selector-select" className="min-w-[150px] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice, i) => (
              <SelectItem key={i} value={choice}>
                {choice}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open, eventDetails) => {
          if (eventDetails.reason === 'escape-key') return;
          if (!open) handleDialogClose();
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {intl.formatMessage(globalMessages.dialogTitle)} ({myBet})
            </DialogTitle>
            <DialogDescription>{intl.formatMessage(globalMessages.dialogWarning)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleBetValidate} disabled={isSubmitting}>
              {intl.formatMessage(globalMessages.submit)}
            </Button>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={handleBetCancel}
              autoFocus
            >
              {intl.formatMessage(globalMessages.cancel)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnumSpectatorThinkingController({ timer }: { timer: Timer }) {
  const intl = useIntl();
  return (
    <div className="flex flex-col h-full items-center justify-center">
      {timer.status === TimerStatus.START && (
        <span className="2xl:text-3xl">{intl.formatMessage(messages.enumThinkingActiveHeader)}</span>
      )}
    </div>
  );
}
