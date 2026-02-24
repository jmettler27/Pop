import { addBet } from '@/backend/services/question/enumeration/actions';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/game/GameEnumerationQuestionRepository';

import { TimerStatus } from '@/backend/models/Timer';
import { UserRole } from '@/backend/models/users/User';

import { range } from '@/backend/utils/arrays';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useGameContext, useRoleContext, useTeamContext, useUserContext } from '@/frontend/contexts';

import { DIALOG_ACTION_CANCEL, DIALOG_ACTION_VALIDATE, DIALOG_TITLE, DIALOG_WARNING } from '@/frontend/texts/dialogs';

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

export default function EnumerationReflectionActiveController({ baseQuestion, timer, lang = DEFAULT_LOCALE }) {
  const myRole = useRoleContext();

  console.log('EnumerationReflectionActiveController', { baseQuestion, timer, myRole });

  switch (myRole) {
    case UserRole.PLAYER:
      return <EnumPlayerReflectionActive baseQuestion={baseQuestion} timer={timer} lang={lang} />;
    default:
      return <EnumSpectatorReflectionActive timer={timer} lang={lang} />;
  }
}

/* ============================================================ Player ============================================================ */
function EnumPlayerReflectionActive({ baseQuestion, timer, lang }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      <AddBetForm baseQuestion={baseQuestion} status={timer.status} lang={lang} />
    </div>
  );
}

function AddBetForm({ baseQuestion, status, lang }) {
  const game = useGameContext();
  const user = useUserContext();
  const myTeam = useTeamContext();

  console.log('AddBetForm', { baseQuestion, status, lang, user, myTeam });

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
          {BET_INPUT_LABEL[lang]}
        </InputLabel>

        <Select
          id="enum-bet-selector-select"
          labelId="enum-bet-selector-select-label"
          value={myBet}
          label={BET_INPUT_LABEL[lang]}
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
          {DIALOG_TITLE[lang]} ({myBet})
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{DIALOG_WARNING[lang]}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="primary"
            // startIcon={<CheckCircleIcon />}
            onClick={handleBetValidate}
            disabled={isSubmitting}
          >
            {DIALOG_ACTION_VALIDATE[lang]}
          </Button>

          <Button
            variant="outlined"
            color="error"
            // startIcon={<CancelIcon />}
            sx={{ color: 'error' }}
            onClick={handleBetCancel}
            autoFocus
          >
            {DIALOG_ACTION_CANCEL[lang]}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const BET_INPUT_LABEL = {
  en: 'My bet',
  'fr-FR': 'Mon pari',
};

/* ============================================================ Spectator ============================================================ */
function EnumSpectatorReflectionActive({ timer, lang }) {
  return (
    <div className="flex flex-col h-full items-center justify-center">
      {timer.status === TimerStatus.START && (
        <span className="2xl:text-3xl">{ENUM_REFLECTION_ACTIVE_HEADER[lang]}</span>
      )}
    </div>
  );
}

const ENUM_REFLECTION_ACTIVE_HEADER = {
  en: 'Waiting for players to bet...',
  'fr-FR': 'En attente des paris...',
};
