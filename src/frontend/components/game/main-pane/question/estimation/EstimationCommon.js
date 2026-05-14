'use client';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { CircularProgress } from '@mui/material';
import { clsx } from 'clsx';
import { useIntl } from 'react-intl';

import { EstimationQuestion } from '@/backend/models/questions/Estimation';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { topicToEmoji } from '@/backend/models/Topic';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import { formatDuration, timestampElapsedSeconds } from '@/frontend/helpers/time';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/utils/defineMessages';

export const messages = defineMessages('frontend.game.middle.EstimationMiddlePane', {
  submitBet: 'Submit bet',
  confirmDialogTitle: 'Are you sure you want to submit this bet?',
  confirmDialogMessage: 'Please review your bet before submitting:',
  teammateSubmitted: 'Your teammate has already submitted!',
  youSubmitted: 'Your bet has been submitted!',
  betTypePrompt: 'How do you want to answer?',
  exactType: 'Exact value',
  exactTypeDesc: 'I know the exact answer',
  rangeType: 'Range',
  rangeTypeDesc: "I'll give a range of values",
  rangeFrom: 'From',
  rangeTo: 'To',
  yourBetExact: 'Your estimate: {value}',
  yourBetRange: 'Your range: {lower} – {upper}',
  correctAnswer: 'Correct answer',
  bounds: 'Between {min} and {max}',
  noSubmission: 'No answer',
  noBetsSubmitted: 'No bets were submitted this round',
  noWinner: 'Nobody got it right this round',
});

export function EstimationQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-4xl">{baseQuestion.title}</h2>
        {baseQuestion.note && <NoteButton note={baseQuestion.note} />}
      </div>
    </div>
  );
}

export function formatElapsedTime(startTimestamp, submittedAtTimestamp, locale) {
  if (!startTimestamp || !submittedAtTimestamp) return null;
  return formatDuration(timestampElapsedSeconds(startTimestamp, submittedAtTimestamp), locale);
}

export function formatAnswerValue(answerType, str, locale) {
  if (str === null || str === undefined || str === '') return '';
  switch (answerType) {
    case EstimationQuestion.AnswerType.INTEGER: {
      const n = parseInt(str, 10);
      return isNaN(n) ? str : n.toLocaleString(locale);
    }
    case EstimationQuestion.AnswerType.YEAR: {
      const n = parseInt(str, 10);
      return isNaN(n) ? str : String(n);
    }
    case EstimationQuestion.AnswerType.DECIMAL: {
      const n = parseFloat(str);
      return isNaN(n) ? str : n.toLocaleString(locale);
    }
    case EstimationQuestion.AnswerType.DATE: {
      const parts = str.split('-');
      if (parts.length !== 3) return str;
      const [y, m, d] = parts.map(Number);
      const date = new Date(y, m - 1, d);
      return isNaN(date.getTime()) ? str : date.toLocaleDateString(locale);
    }
    default:
      return str;
  }
}

export function EstimationResultsTable({ gameQuestion, baseQuestion }) {
  const intl = useIntl();
  const { teamRepo, playerRepo } = useGameRepositories();
  const { teams, loading: teamsLoading } = teamRepo.useAllTeamsOnce();
  const { players, loading: playersLoading } = playerRepo.useAllPlayersOnce();

  if (teamsLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <CircularProgress />
      </div>
    );
  }

  if (!teams || !players) return null;

  const bets = gameQuestion.bets || [];
  const winnerTeamIds = new Set(gameQuestion.winners || []);

  const sortedTeams = [...teams].sort((a, b) => {
    const rank = (id) => (winnerTeamIds.has(id) ? 0 : bets.some((bet) => bet.teamId === id) ? 1 : 2);
    return rank(a.id) - rank(b.id);
  });

  const noBet = bets.length === 0;
  const noWinner = winnerTeamIds.size === 0 && bets.length > 0;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {noBet && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600/50 bg-slate-800/60 text-slate-400 text-sm 2xl:text-base">
          <span>🤔</span>
          <span>{intl.formatMessage(messages.noBetsSubmitted)}</span>
        </div>
      )}
      {noWinner && !noBet && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600/50 bg-slate-800/60 text-slate-400 text-sm 2xl:text-base">
          <span>😬</span>
          <span>{intl.formatMessage(messages.noWinner)}</span>
        </div>
      )}
      {sortedTeams.map((team) => {
        const bet = bets.find((b) => b.teamId === team.id);
        const player = bet ? players.find((p) => p.id === bet.playerId) : null;
        const isWinner = winnerTeamIds.has(team.id);
        return (
          <BetResultRow
            key={team.id}
            team={team}
            player={player}
            bet={bet}
            isWinner={isWinner}
            baseQuestion={baseQuestion}
            gameQuestion={gameQuestion}
            intl={intl}
          />
        );
      })}
    </div>
  );
}

function BetResultRow({ team, player, bet, isWinner, baseQuestion, gameQuestion, intl }) {
  const betDisplay = bet
    ? bet.type === EstimationQuestion.BetType.EXACT
      ? formatAnswerValue(baseQuestion.answerType, bet.estimation, intl.locale)
      : `${formatAnswerValue(baseQuestion.answerType, bet.lower, intl.locale)} – ${formatAnswerValue(baseQuestion.answerType, bet.upper, intl.locale)}`
    : null;
  const elapsed = bet ? formatElapsedTime(gameQuestion.dateStart, bet.submittedAt, intl.locale) : null;

  return (
    <div
      className={clsx(
        'flex flex-row items-center gap-3 px-4 py-3 2xl:py-4 rounded-2xl border-2 transition-all duration-300',
        isWinner
          ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10'
          : bet
            ? 'border-slate-700 bg-slate-800/60'
            : 'border-slate-800 bg-slate-900/30 opacity-40'
      )}
    >
      {/* Trophy or spacer */}
      <div className="w-6 shrink-0 flex items-center justify-center">
        {isWinner && <EmojiEventsIcon sx={{ color: '#4ade80', fontSize: 20 }} />}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 2xl:w-12 2xl:h-12 rounded-full overflow-hidden shrink-0 bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-slate-300 select-none">
        {player?.image ? (
          <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <span>{player?.name?.[0]?.toUpperCase() ?? '?'}</span>
        )}
      </div>

      {/* Names */}
      <div className="flex flex-col min-w-0 flex-1">
        <span
          className={clsx('font-bold text-base 2xl:text-lg truncate', isWinner ? 'text-green-200' : 'text-slate-100')}
        >
          {team.name}
        </span>
        {player && <span className="text-xs 2xl:text-sm text-slate-400 truncate">{player.name}</span>}
      </div>

      {/* Bet value + elapsed time */}
      <div className="flex flex-col items-end shrink-0">
        <div
          className={clsx(
            'text-right font-semibold text-base 2xl:text-xl tabular-nums',
            isWinner ? 'text-green-300' : 'text-slate-200'
          )}
        >
          {bet ? (
            betDisplay
          ) : (
            <span className="text-sm font-normal italic text-slate-500">
              {intl.formatMessage(messages.noSubmission)}
            </span>
          )}
        </div>
        {elapsed && <span className="text-xs text-slate-500 tabular-nums">{elapsed}</span>}
      </div>
    </div>
  );
}

export function EstimationEndView({ gameQuestion, baseQuestion }) {
  const intl = useIntl();

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl 2xl:max-w-2xl max-h-full overflow-y-auto py-4 px-4">
      <div className="flex flex-row items-center gap-3 px-5 py-2.5 rounded-2xl border border-green-500/40 bg-green-500/10 shrink-0 w-full justify-center">
        <span className="text-sm uppercase tracking-widest text-slate-400 font-semibold">
          {intl.formatMessage(messages.correctAnswer)}
        </span>
        <span className="text-3xl 2xl:text-4xl font-bold text-green-400 tabular-nums">
          {formatAnswerValue(baseQuestion.answerType, baseQuestion.answer, intl.locale)}
        </span>
      </div>
      <EstimationResultsTable gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
    </div>
  );
}
