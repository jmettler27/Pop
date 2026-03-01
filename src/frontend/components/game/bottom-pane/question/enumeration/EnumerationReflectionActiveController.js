import { addBet } from '@/backend/services/question/enumeration/actions';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';

import { TimerStatus } from '@/backend/models/Timer';
import { ParticipantRole } from '@/backend/models/users/Participant';

import { range } from '@/backend/utils/arrays';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import globalMessages from '@/i18n/globalMessages';

import { useGameContext, useRoleContext, useTeamContext, useUserContext } from '@/frontend/contexts';

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
} from '@mui/material';

const messages = defineMessages('frontend.game.bottom.EnumerationReflectionActiveController', {
  betInputLabel: 'My bet',
  enumReflectionActiveHeader: 'Waiting for players to bet...',
});

export default function EnumerationReflectionActiveController({ baseQuestion, timer }) {
  const myRole = useRoleContext();

  console.log('EnumerationReflectionActiveController', { baseQuestion, timer, myRole });

  switch (myRole) {
    case ParticipantRole.PLAYER:
      return <EnumPlayerReflectionActive baseQuestion={baseQuestion} timer={timer} />;
    default:
      return <EnumSpectatorReflectionActive timer={timer} />;
  }
}

/* ============================================================ Player ============================================================ */
function EnumPlayerReflectionActive({ baseQuestion, timer }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <AddBetForm baseQuestion={baseQuestion} status={timer.status} />
    </div>
  );
}

function AddBetForm({ baseQuestion, status }) {
  const intl = useIntl();
  const game = useGameContext();
  const user = useUserContext();
  const myTeam = useTeamContext();

  console.log('AddBetForm', { baseQuestion, status, user, myTeam });

  const [handleBetValidate, isSubmitting] = useAsyncAction(async () => {
    await addBet(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, myBet);
    setHasValidated(true);
    setDialogOpen(false);
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [myBet, setMyBet] = useState(0);
  const [hasValidated, setHasValidated] = useState(false);

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id, game.currentRound);
  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion);

  if (playersError) {
    return (
      <p>
        <strong>Error: </strong>
        {JSON.stringify(playersError)}
      </p>
    );
  }
  if (playersLoading) {
    return <CircularProgress />;
  }
  if (!questionPlayers) {
    return <></>;
  }

  const hasBet = questionPlayers.bets.some((bet) => bet.playerId == user.id);
  const selectorDisabled = status !== TimerStatus.START || hasValidated || hasBet;

  const handleSelectorChange = (event) => {
    setDialogOpen(true);
    setMyBet(event.target.value);
  };

  const handleBetCancel = () => {
    setMyBet(0);
    setDialogOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const choices = range(baseQuestion.answer.length + 1);

  return (
    <div className="flex flex-row items-center justify-center">
      {/* Selector of the bet */}
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
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'inherit',
            },
            // MuiInputBase-root-MuiOutlinedInput-root-MuiSelect-root.Mui-focused
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'red',
            },
            '& .MuiSelect-icon': {
              color: 'inherit',
            },
          }}
        >
          {choices.map((choice, i) => (
            <MenuItem key={i} value={choice}>
              {choice}
            </MenuItem>
          ))}
          {/* {!baseQuestion.maxIsKnown && <MenuItem value={baseQuestion.answer.length}>{`> ${baseQuestion.answer.length}`}</MenuItem>} */}
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
          <Button
            variant="contained"
            color="primary"
            // startIcon={<CheckCircleIcon />}
            onClick={handleBetValidate}
            disabled={isSubmitting}
          >
            {intl.formatMessage(globalMessages.dialogValidate)}
          </Button>

          <Button
            variant="outlined"
            color="error"
            // startIcon={<CancelIcon />}
            sx={{ color: 'error' }}
            onClick={handleBetCancel}
            autoFocus
          >
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

/* ============================================================ Spectator ============================================================ */
function EnumSpectatorReflectionActive({ timer }) {
  const intl = useIntl();
  return (
    <div className="flex flex-col h-full items-center justify-center">
      {timer.status === TimerStatus.START && (
        <span className="2xl:text-3xl">{intl.formatMessage(messages.enumReflectionActiveHeader)}</span>
      )}
    </div>
  );
}
