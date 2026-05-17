'use client';

import { useState } from 'react';

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from '@mui/material';
import { useIntl } from 'react-intl';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import { addBet } from '@/backend/services/question/enumeration/actions';
import { range } from '@/backend/utils/arrays';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { EnumerationBet, EnumerationQuestion } from '@/models/questions/enumeration';
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
  const myRole = useRole();

  switch (myRole) {
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
  const game = useGame();
  const user = useUser();
  const myTeam = useTeam();

  const [handleBetValidate, isSubmitting] = useAsyncAction(async () => {
    if (!game || !user) return;
    const bet: EnumerationBet = {
      bet: Number(myBet),
      playerId: user.id!,
      teamId: myTeam as string,
      timestamp: Date.now(),
    };
    await addBet(game.id as string, game.currentRound as string, game.currentQuestion as string, bet);
    setHasValidated(true);
    setDialogOpen(false);
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [myBet, setMyBet] = useState(0);
  const [hasValidated, setHasValidated] = useState(false);

  const gameQuestionRepo = new GameEnumerationQuestionRepository(
    game!.id as string,
    (game as GameRounds | null)?.currentRound as string
  );
  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = gameQuestionRepo.useQuestionPlayers((game as GameRounds | null)?.currentQuestion as string);

  if (playersError) {
    return <></>;
  }
  if (playersLoading) {
    return <CircularProgress />;
  }
  if (!questionPlayers) {
    return <></>;
  }

  const bets = (questionPlayers as { bets?: Array<{ playerId: string }> }).bets ?? [];
  const hasBet = bets.some((bet) => bet.playerId === user?.id);
  const selectorDisabled = status !== TimerStatus.START || hasValidated || hasBet;

  const handleSelectorChange = (event: SelectChangeEvent<number>) => {
    setDialogOpen(true);
    setMyBet(Number(event.target.value));
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
      <FormControl sx={{ m: 1, minWidth: 150 }} disabled={selectorDisabled}>
        <InputLabel id="enum-bet-selector-input-label" sx={{ color: 'inherit' }}>
          {intl.formatMessage(messages.betInputLabel)}
        </InputLabel>

        <Select
          id="enum-bet-selector-select"
          labelId="enum-bet-selector-select-label"
          value={myBet}
          label={intl.formatMessage(messages.betInputLabel)}
          onChange={handleSelectorChange}
          autoWidth
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'red' },
            '& .MuiSelect-icon': { color: 'inherit' },
          }}
        >
          {choices.map((choice, i) => (
            <MenuItem key={i} value={choice}>
              {choice}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Dialog disableEscapeKeyDown open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>
          {intl.formatMessage(globalMessages.dialogTitle)} ({myBet})
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{intl.formatMessage(globalMessages.dialogWarning)}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleBetValidate} disabled={isSubmitting}>
            {intl.formatMessage(globalMessages.submit)}
          </Button>
          <Button variant="outlined" color="error" sx={{ color: 'error' }} onClick={handleBetCancel} autoFocus>
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogActions>
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
