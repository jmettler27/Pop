'use client';

import { useState } from 'react';

import { clsx } from 'clsx';
import { CheckCircle2, SlidersHorizontal, Target } from 'lucide-react';
import { useIntl } from 'react-intl';

import { submitBet } from '@/backend/services/question/estimation/actions';
import {
  EstimationEndView,
  EstimationQuestionHeader,
  formatAnswerValue,
  messages,
} from '@/frontend/components/game/main-pane/question/estimation/EstimationCommon';
import { Button } from '@/frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/frontend/components/ui/dialog';
import { Input } from '@/frontend/components/ui/input';
import { Label } from '@/frontend/components/ui/label';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useIsMobile from '@/frontend/hooks/useIsMobile';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameStatus } from '@/models/games/game-status';
import {
  EstimationBet,
  EstimationQuestion,
  GameEstimationQuestion,
  RangeEstimationBet,
} from '@/models/questions/estimation';

const darkInputClassName = clsx(
  'min-w-[200px] xl:min-w-[300px]',
  'border-slate-500/50 bg-slate-900/60 text-slate-200',
  'hover:border-slate-400/70 focus-visible:border-blue-400'
);
const darkLabelClassName = 'text-slate-400/80 group-focus-within:text-blue-400';

interface EstimationPlayerPaneProps {
  baseQuestion: EstimationQuestion;
  gameQuestion: GameEstimationQuestion;
}

export default function EstimationPlayerPane({ baseQuestion, gameQuestion }: EstimationPlayerPaneProps) {
  const game = useGame();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full items-center">
      {!isMobile && (
        <div className="shrink-0 w-full flex flex-col items-center justify-center py-3">
          <EstimationQuestionHeader baseQuestion={baseQuestion} />
        </div>
      )}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center">
        {game!.status === GameStatus.QUESTION_ACTIVE && (
          <EstimationPlayerActiveView baseQuestion={baseQuestion} gameQuestion={gameQuestion} />
        )}
        {game!.status === GameStatus.QUESTION_END && (
          <EstimationEndView gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
        )}
      </div>
    </div>
  );
}

interface BetTypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}

function BetTypeCard({ icon, title, description, selected, onClick, disabled }: BetTypeCardProps) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={clsx(
        'w-36 h-36 md:w-44 md:h-44 2xl:w-64 2xl:h-64 rounded-3xl flex flex-col items-center justify-center gap-2 md:gap-3 2xl:gap-5 select-none',
        'border-2 transition-all duration-200',
        'shadow-lg',
        disabled ? 'opacity-40 cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-xl',
        selected
          ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/40'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
      )}
    >
      <div className={clsx('text-3xl md:text-4xl 2xl:text-6xl', selected ? 'text-blue-400' : 'text-slate-400')}>
        {icon}
      </div>
      <span
        className={clsx(
          'font-bold text-sm md:text-lg 2xl:text-2xl text-center',
          selected ? 'text-blue-200' : 'text-slate-200'
        )}
      >
        {title}
      </span>
      <span className="text-xs md:text-sm 2xl:text-base text-center text-slate-400 px-2 leading-tight min-h-[2rem] md:min-h-[2.5rem] 2xl:min-h-[3rem] flex items-start justify-center">
        {description}
      </span>
    </div>
  );
}

interface NumberOrDateInputProps {
  id: string;
  answerType: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
}

function NumberOrDateInput({ id, answerType, value, onChange, label }: NumberOrDateInputProps) {
  const intl = useIntl();

  if (answerType === EstimationQuestion.AnswerType.DATE) {
    return (
      <div className="group flex flex-col gap-1.5">
        <Label htmlFor={id} className={darkLabelClassName}>
          {label}
        </Label>
        <Input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={EstimationQuestion.DATE_MIN}
          max={EstimationQuestion.DATE_MAX}
          lang={intl.locale}
          className={darkInputClassName}
        />
      </div>
    );
  }

  const { min, max, step } = getNumericBounds(answerType);
  return (
    <div className="group flex flex-col gap-1.5">
      <Label htmlFor={id} className={darkLabelClassName}>
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className={darkInputClassName}
      />
      <p className="text-xs text-slate-400/70">
        {intl.formatMessage(messages.bounds, {
          min: min.toLocaleString(),
          max: max.toLocaleString(),
        })}
      </p>
    </div>
  );
}

function getNumericBounds(answerType: string): { min: number; max: number; step: number | string } {
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

function isRangeValid(answerType: string, from: string, to: string): boolean {
  if (from === '' || to === '') return false;
  if (answerType === EstimationQuestion.AnswerType.DATE) return from <= to;
  const f = parseFloat(from);
  const t = parseFloat(to);
  return !isNaN(f) && !isNaN(t) && f <= t;
}

interface EstimationPlayerActiveViewProps {
  baseQuestion: EstimationQuestion;
  gameQuestion: GameEstimationQuestion;
}

function EstimationPlayerActiveView({ baseQuestion, gameQuestion }: EstimationPlayerActiveViewProps) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const user = useUser();
  const myTeam = useTeam();

  const [betType, setBetType] = useState<string | null>(null);
  const [exactValue, setExactValue] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const teamSubmitted = gameQuestion.bets?.some((b) => b.teamId === myTeam);
  const teamSubmission = gameQuestion.bets?.find((b) => b.teamId === myTeam);
  const submittedByMe = teamSubmission?.playerId === user?.id;

  const isExactValid = betType === EstimationQuestion.BetType.EXACT && exactValue !== '';
  const isRangeValidState =
    betType === EstimationQuestion.BetType.RANGE && isRangeValid(baseQuestion.answerType, rangeFrom, rangeTo);
  const canSubmit = isExactValid || isRangeValidState;

  const bet =
    betType === EstimationQuestion.BetType.EXACT
      ? { type: EstimationQuestion.BetType.EXACT, estimation: exactValue }
      : { type: EstimationQuestion.BetType.RANGE, lower: rangeFrom, upper: rangeTo };

  const [handleSubmitBet, isSubmitting] = useAsyncAction(async () => {
    if (!user) return;
    await submitBet(gameId, roundId, questionId, user.id!, myTeam as string, bet as EstimationBet);
    setDialogOpen(false);
  });

  if (teamSubmitted && teamSubmission) {
    const isExact = teamSubmission.type === EstimationQuestion.BetType.EXACT;
    const displayValue = isExact
      ? intl.formatMessage(messages.yourBetExact, {
          value: formatAnswerValue(baseQuestion.answerType, teamSubmission.estimation, intl.locale),
        })
      : intl.formatMessage(messages.yourBetRange, {
          lower: formatAnswerValue(baseQuestion.answerType, (teamSubmission as RangeEstimationBet).lower, intl.locale),
          upper: formatAnswerValue(baseQuestion.answerType, (teamSubmission as RangeEstimationBet).upper, intl.locale),
        });

    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <CheckCircle2 className="size-14 text-green-500" />
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

      <div className="flex flex-row gap-3 md:gap-6 2xl:gap-10 justify-center">
        <BetTypeCard
          icon={<Target className="size-[1em]" />}
          title={intl.formatMessage(messages.exactType)}
          description={intl.formatMessage(messages.exactTypeDesc)}
          selected={betType === EstimationQuestion.BetType.EXACT}
          disabled={!!teamSubmitted}
          onClick={() => {
            setBetType(EstimationQuestion.BetType.EXACT);
            setRangeFrom('');
            setRangeTo('');
          }}
        />
        <BetTypeCard
          icon={<SlidersHorizontal className="size-[1em]" />}
          title={intl.formatMessage(messages.rangeType)}
          description={intl.formatMessage(messages.rangeTypeDesc)}
          selected={betType === EstimationQuestion.BetType.RANGE}
          disabled={!!teamSubmitted}
          onClick={() => {
            setBetType(EstimationQuestion.BetType.RANGE);
            setExactValue('');
          }}
        />
      </div>

      {betType === EstimationQuestion.BetType.EXACT && (
        <div className="flex justify-center">
          <NumberOrDateInput
            id="exact-value-input"
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
            id="range-from-input"
            answerType={baseQuestion.answerType}
            value={rangeFrom}
            onChange={setRangeFrom}
            label={intl.formatMessage(messages.rangeFrom)}
          />
          <NumberOrDateInput
            id="range-to-input"
            answerType={baseQuestion.answerType}
            value={rangeTo}
            onChange={setRangeTo}
            label={intl.formatMessage(messages.rangeTo)}
          />
        </div>
      )}

      {betType && (
        <Button
          size="lg"
          className={clsx(
            'bg-green-600 text-white hover:bg-green-600/80',
            'rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 2xl:text-xl 2xl:py-3 2xl:px-8'
          )}
          onClick={() => setDialogOpen(true)}
          disabled={!canSubmit || isSubmitting}
        >
          {intl.formatMessage(messages.submitBet)}
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{intl.formatMessage(messages.confirmDialogTitle)}</DialogTitle>
            <DialogDescription>{intl.formatMessage(messages.confirmDialogMessage)}</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button
              className="bg-green-600 text-white hover:bg-green-600/80"
              onClick={handleSubmitBet}
              disabled={isSubmitting}
            >
              {intl.formatMessage(globalMessages.submit)}
            </Button>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              {intl.formatMessage(globalMessages.cancel)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
