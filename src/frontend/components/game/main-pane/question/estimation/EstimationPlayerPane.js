'use client';

import { useState } from 'react';

import AdjustIcon from '@mui/icons-material/Adjust';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import { clsx } from 'clsx';
import { useIntl } from 'react-intl';

import { GameStatus } from '@/backend/models/games/GameStatus';
import { EstimationQuestion } from '@/backend/models/questions/Estimation';
import { submitBet } from '@/backend/services/question/estimation/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/i18n/globalMessages';

import { EstimationEndView, EstimationQuestionHeader, formatAnswerValue, messages } from './EstimationCommon';

// Dark-mode-aware MUI TextField styling; grows input width at xl breakpoint
const darkInputSx = (theme) => ({
  minWidth: 200,
  [theme.breakpoints.up('xl')]: { minWidth: 300 },
  '& .MuiOutlinedInput-root': {
    color: 'rgb(226, 232, 240)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    '& fieldset': { borderColor: 'rgba(100, 116, 139, 0.5)' },
    '&:hover fieldset': { borderColor: 'rgba(148, 163, 184, 0.7)' },
    '&.Mui-focused fieldset': { borderColor: 'rgb(96, 165, 250)' },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(148, 163, 184, 0.8)',
    '&.Mui-focused': { color: 'rgb(96, 165, 250)' },
  },
  '& .MuiFormHelperText-root': { color: 'rgba(148, 163, 184, 0.7)' },
});

export default function EstimationPlayerPane({ baseQuestion, gameQuestion }) {
  const game = useGame();

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <EstimationQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        {game.status === GameStatus.QUESTION_ACTIVE && (
          <EstimationPlayerActiveView baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
        )}
        {game.status === GameStatus.QUESTION_END && (
          <EstimationEndView gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}

function BetTypeCard({ icon, title, description, selected, onClick, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={clsx(
        'w-44 h-44 2xl:w-64 2xl:h-64 rounded-3xl flex flex-col items-center justify-center gap-3 2xl:gap-5 select-none',
        'border-2 transition-all duration-200',
        'shadow-lg',
        disabled ? 'opacity-40 cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-xl',
        selected
          ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/40'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
      )}
    >
      <div className={clsx('text-4xl 2xl:text-6xl', selected ? 'text-blue-400' : 'text-slate-400')}>{icon}</div>
      <span
        className={clsx('font-bold text-lg 2xl:text-2xl text-center', selected ? 'text-blue-200' : 'text-slate-200')}
      >
        {title}
      </span>
      <span className="text-sm 2xl:text-base text-center text-slate-400 px-3 leading-tight min-h-[2.5rem] 2xl:min-h-[3rem] flex items-start justify-center">
        {description}
      </span>
    </div>
  );
}

function NumberOrDateInput({ answerType, value, onChange, label }) {
  const intl = useIntl();

  if (answerType === EstimationQuestion.AnswerType.DATE) {
    return (
      <TextField
        label={label}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: EstimationQuestion.DATE_MIN, max: EstimationQuestion.DATE_MAX, lang: intl.locale }}
        sx={darkInputSx}
      />
    );
  }

  const { min, max, step } = getNumericBounds(answerType);
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputProps={{ min, max, step }}
      helperText={intl.formatMessage(messages.bounds, {
        min: min.toLocaleString(),
        max: max.toLocaleString(),
      })}
      sx={darkInputSx}
    />
  );
}

function getNumericBounds(answerType) {
  switch (answerType) {
    case EstimationQuestion.AnswerType.INTEGER:
      return { min: EstimationQuestion.INTEGER_MIN, max: EstimationQuestion.INTEGER_MAX, step: 1 };
    case EstimationQuestion.AnswerType.YEAR:
      return { min: EstimationQuestion.YEAR_MIN, max: EstimationQuestion.YEAR_MAX, step: 1 };
    case EstimationQuestion.AnswerType.DECIMAL:
      return { min: EstimationQuestion.DECIMAL_MIN, max: EstimationQuestion.DECIMAL_MAX, step: 'any' };
    default:
      return { min: -Infinity, max: Infinity, step: 1 };
  }
}

function isRangeValid(answerType, from, to) {
  if (from === '' || to === '') return false;
  if (answerType === EstimationQuestion.AnswerType.DATE) return from <= to;
  const f = parseFloat(from);
  const t = parseFloat(to);
  return !isNaN(f) && !isNaN(t) && f <= t;
}

function EstimationPlayerActiveView({ baseQuestion, gameQuestion }) {
  const intl = useIntl();
  const game = useGame();
  const user = useUser();
  const myTeam = useTeam();

  const [betType, setBetType] = useState(null);
  const [exactValue, setExactValue] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const teamSubmitted = gameQuestion.bets?.some((b) => b.teamId === myTeam);
  const teamSubmission = gameQuestion.bets?.find((b) => b.teamId === myTeam);
  const submittedByMe = teamSubmission?.playerId === user.id;

  const isExactValid = betType === EstimationQuestion.BetType.EXACT && exactValue !== '';
  const isRangeValidState =
    betType === EstimationQuestion.BetType.RANGE && isRangeValid(baseQuestion.answerType, rangeFrom, rangeTo);
  const canSubmit = isExactValid || isRangeValidState;

  const bet =
    betType === EstimationQuestion.BetType.EXACT
      ? { type: EstimationQuestion.BetType.EXACT, estimation: exactValue }
      : { type: EstimationQuestion.BetType.RANGE, lower: rangeFrom, upper: rangeTo };

  const [handleSubmitBet, isSubmitting] = useAsyncAction(async () => {
    console.log('Submitting bet:', bet);
    await submitBet(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, bet);
    setDialogOpen(false);
  });

  if (teamSubmitted && teamSubmission) {
    const isExact = teamSubmission.type === EstimationQuestion.BetType.EXACT;
    const displayValue = isExact
      ? intl.formatMessage(messages.yourBetExact, {
          value: formatAnswerValue(baseQuestion.answerType, teamSubmission.estimation, intl.locale),
        })
      : intl.formatMessage(messages.yourBetRange, {
          lower: formatAnswerValue(baseQuestion.answerType, teamSubmission.lower, intl.locale),
          upper: formatAnswerValue(baseQuestion.answerType, teamSubmission.upper, intl.locale),
        });

    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
        <span className="text-xl 2xl:text-3xl font-semibold text-green-500">
          {submittedByMe ? intl.formatMessage(messages.youSubmitted) : intl.formatMessage(messages.teammateSubmitted)}
        </span>
        <span className="text-lg 2xl:text-2xl text-slate-300">{displayValue}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 2xl:gap-10 w-full max-w-lg 2xl:max-w-3xl p-4">
      <span className="text-lg 2xl:text-2xl text-slate-300">{intl.formatMessage(messages.betTypePrompt)}</span>

      <div className="flex flex-row gap-6 2xl:gap-10 justify-center">
        <BetTypeCard
          icon={<AdjustIcon fontSize="inherit" />}
          title={intl.formatMessage(messages.exactType)}
          description={intl.formatMessage(messages.exactTypeDesc)}
          selected={betType === EstimationQuestion.BetType.EXACT}
          disabled={teamSubmitted}
          onClick={() => {
            setBetType(EstimationQuestion.BetType.EXACT);
            setRangeFrom('');
            setRangeTo('');
          }}
        />
        <BetTypeCard
          icon={<LinearScaleIcon fontSize="inherit" />}
          title={intl.formatMessage(messages.rangeType)}
          description={intl.formatMessage(messages.rangeTypeDesc)}
          selected={betType === EstimationQuestion.BetType.RANGE}
          disabled={teamSubmitted}
          onClick={() => {
            setBetType(EstimationQuestion.BetType.RANGE);
            setExactValue('');
          }}
        />
      </div>

      {betType === EstimationQuestion.BetType.EXACT && (
        <div className="flex justify-center">
          <NumberOrDateInput
            answerType={baseQuestion.answerType}
            value={exactValue}
            onChange={setExactValue}
            label={intl.formatMessage(messages.exactType)}
          />
        </div>
      )}

      {betType === EstimationQuestion.BetType.RANGE && (
        <div className="flex flex-row gap-4 2xl:gap-8 items-start justify-center flex-wrap">
          <NumberOrDateInput
            answerType={baseQuestion.answerType}
            value={rangeFrom}
            onChange={setRangeFrom}
            label={intl.formatMessage(messages.rangeFrom)}
          />
          <NumberOrDateInput
            answerType={baseQuestion.answerType}
            value={rangeTo}
            onChange={setRangeTo}
            label={intl.formatMessage(messages.rangeTo)}
          />
        </div>
      )}

      {betType && (
        <Button
          variant="contained"
          color="success"
          size="large"
          className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 2xl:text-xl 2xl:py-3 2xl:px-8"
          onClick={() => setDialogOpen(true)}
          disabled={!canSubmit || isSubmitting}
        >
          {intl.formatMessage(messages.submitBet)}
        </Button>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{intl.formatMessage(messages.confirmDialogTitle)}</DialogTitle>
        <DialogContent>
          <DialogContentText>{intl.formatMessage(messages.confirmDialogMessage)}</DialogContentText>
          <p className="mt-4 text-lg font-semibold">
            {betType === EstimationQuestion.BetType.EXACT
              ? intl.formatMessage(messages.yourBetExact, {
                  value: formatAnswerValue(baseQuestion.answerType, exactValue, intl.locale),
                })
              : intl.formatMessage(messages.yourBetRange, {
                  lower: formatAnswerValue(baseQuestion.answerType, rangeFrom, intl.locale),
                  upper: formatAnswerValue(baseQuestion.answerType, rangeTo, intl.locale),
                })}
          </p>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="success" onClick={handleSubmitBet} disabled={isSubmitting}>
            {intl.formatMessage(globalMessages.submit)}
          </Button>
          <Button variant="outlined" color="error" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
            {intl.formatMessage(globalMessages.cancel)}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
