import { memo, ReactNode, useState } from 'react';
import { useParams } from 'next/navigation';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, Divider, Typography } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import { QuestionCardContent } from '@/frontend/components/common/QuestionCard';
import { Locale } from '@/frontend/helpers/locales';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { BasicQuestion, GameBasicQuestion } from '@/models/questions/basic';
import { BlindtestQuestion, GameBlindtestQuestion } from '@/models/questions/blindtest';
import { EmojiQuestion, GameEmojiQuestion } from '@/models/questions/emoji';
import { EnumerationQuestion } from '@/models/questions/enumeration';
import { EstimationQuestion } from '@/models/questions/estimation';
import { GameImageQuestion, ImageQuestion } from '@/models/questions/image';
import { LabellingQuestion } from '@/models/questions/labelling';
import { MatchingQuestion } from '@/models/questions/matching';
import { GameMCQQuestion, MCQQuestion } from '@/models/questions/mcq';
import { GameNaguiQuestion, NaguiQuestion } from '@/models/questions/nagui';
import { OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { GameProgressiveCluesQuestion, ProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { QuestionType, questionTypeToTitle } from '@/models/questions/question-type';
import { GameQuoteQuestion, QuoteQuestion } from '@/models/questions/quote';
import { ReorderingQuestion } from '@/models/questions/reordering';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import Team from '@/models/team';
import { Topic, topicToEmoji } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';
import { Player } from '@/models/users/player';

/* ============================================================ */
/* Main component                                               */
/* ============================================================ */

interface RoundQuestionsProgressProps {
  game: GameRounds;
  round: AnyRound;
}

export default function RoundQuestionsProgress({ game, round }: RoundQuestionsProgressProps) {
  const [expandedId, setExpandedId] = useState<string | null>(game.currentQuestion ?? null);
  const [prevGameCurrentQuestion, setPrevGameCurrentQuestion] = useState(game.currentQuestion);
  const [prevGameStatus, setPrevGameStatus] = useState(game.status);
  if (game.currentQuestion !== prevGameCurrentQuestion || game.status !== prevGameStatus) {
    setPrevGameCurrentQuestion(game.currentQuestion);
    setPrevGameStatus(game.status);
    if (game.status === GameStatus.ROUND_START || game.status === GameStatus.ROUND_END) {
      setExpandedId(null);
    } else {
      setExpandedId(game.currentQuestion ?? null);
    }
  }

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo, playerRepo } = gameRepositories;

  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeamsOnce();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayersOnce();

  if (teamsError || playersError) return <></>;
  if (teamsLoading || playersLoading) return <CircularProgress />;
  if (!teams || !players) return <></>;

  const isExpanded = (questionId: string) => expandedId === questionId;
  const handleAccordionChange = (questionId: string) => setExpandedId(isExpanded(questionId) ? null : questionId);

  const currentRoundQuestionIdx = (game.currentQuestion ? round.currentQuestionIdx : -1) ?? -1;

  return (
    <div className="w-full mt-4 px-2 space-y-2">
      {round.questions.map((questionId: string, idx: number) => (
        <RoundQuestionAccordion
          key={questionId}
          roundId={round.id as string}
          roundType={round.type as RoundType}
          questionId={questionId}
          order={idx}
          hasEnded={idx < currentRoundQuestionIdx}
          isCurrent={idx === currentRoundQuestionIdx}
          hasNotStarted={idx > currentRoundQuestionIdx}
          onAccordionChange={() => handleAccordionChange(questionId)}
          expanded={isExpanded(questionId)}
          game={game}
          teams={teams}
          players={players}
        />
      ))}
    </div>
  );
}

/* ============================================================ */
/* Shared types                                                 */
/* ============================================================ */

interface TypedAccordionProps {
  game: GameRounds;
  roundId: string;
  questionId: string;
  order: number;
  hasEnded: boolean;
  isCurrent: boolean;
  hasNotStarted: boolean;
  onAccordionChange: () => void;
  expanded: boolean;
  teams: Team[];
  players: Player[];
}

/* ============================================================ */
/* Shared hooks                                                 */
/* ============================================================ */

function useRoundQuestion(questionType: QuestionType, roundId: string, questionId: string) {
  const { id: gameId } = useParams();
  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(questionType, gameId as string, roundId);
  const baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(questionType);
  const { gameQuestion, loading: gqLoading, error: gqError } = gameQuestionRepo.useQuestion(questionId);
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(questionId);
  return {
    gameQuestion,
    baseQuestion,
    loading: gqLoading || baseQuestionLoading,
    error: gqError || baseQuestionError,
  };
}

function useAccordionState(game: GameRounds, isCurrent: boolean, hasEnded: boolean, hasNotStarted: boolean) {
  const myRole = useRole();
  return {
    showComplete:
      myRole === ParticipantRole.ORGANIZER ||
      (isCurrent && game.status === GameStatus.QUESTION_END) ||
      hasEnded ||
      game.status === GameStatus.ROUND_END,
    disabled: myRole !== ParticipantRole.ORGANIZER && hasNotStarted,
  };
}

/* ============================================================ */
/* Dispatcher                                                   */
/* ============================================================ */

export const RoundQuestionAccordion = memo(function RoundQuestionAccordion({
  roundType,
  ...props
}: TypedAccordionProps & { roundType: RoundType }) {
  switch (roundType) {
    case RoundType.BASIC:
      return <BasicRoundQuestionAccordion {...props} />;
    case RoundType.BLINDTEST:
      return <BlindtestRoundQuestionAccordion {...props} />;
    case RoundType.EMOJI:
      return <EmojiRoundQuestionAccordion {...props} />;
    case RoundType.ENUMERATION:
      return <EnumerationRoundQuestionAccordion {...props} />;
    case RoundType.ESTIMATION:
      return <EstimationRoundQuestionAccordion {...props} />;
    case RoundType.IMAGE:
      return <ImageRoundQuestionAccordion {...props} />;
    case RoundType.LABELLING:
      return <LabellingRoundQuestionAccordion {...props} />;
    case RoundType.MATCHING:
      return <MatchingRoundQuestionAccordion {...props} />;
    case RoundType.MCQ:
      return <MCQRoundQuestionAccordion {...props} />;
    case RoundType.NAGUI:
      return <NaguiRoundQuestionAccordion {...props} />;
    case RoundType.ODD_ONE_OUT:
      return <OddOneOutRoundQuestionAccordion {...props} />;
    case RoundType.PROGRESSIVE_CLUES:
      return <ProgressiveCluesRoundQuestionAccordion {...props} />;
    case RoundType.QUOTE:
      return <QuoteRoundQuestionAccordion {...props} />;
    case RoundType.REORDERING:
      return <ReorderingRoundQuestionAccordion {...props} />;
    default:
      return null;
  }
});

/* ============================================================ */
/* Shared UI components                                         */
/* ============================================================ */

interface AccordionShellProps {
  expanded: boolean;
  disabled: boolean;
  isCurrent: boolean;
  hasNotStarted: boolean;
  showComplete: boolean;
  winnerTeam: Team | null;
  onAccordionChange: () => void;
  game: GameRounds;
  summary: ReactNode;
  details: ReactNode;
}

function AccordionShell({
  expanded,
  disabled,
  isCurrent,
  hasNotStarted,
  showComplete,
  winnerTeam,
  onAccordionChange,
  game,
  summary,
  details,
}: AccordionShellProps) {
  const borderColor = hasNotStarted ? '#6b7280' : showComplete ? (winnerTeam?.color ?? 'inherit') : undefined;

  return (
    <Accordion
      expanded={expanded}
      onChange={onAccordionChange}
      disabled={disabled}
      className={clsx('rounded-lg', isCurrent && game.status === GameStatus.QUESTION_ACTIVE && 'glow-border-white')}
      elevation={0}
      sx={{
        borderWidth: isCurrent ? '2px' : '1px',
        borderStyle: 'solid',
        borderColor,
        backgroundColor: 'inherit',
        color: 'inherit',
      }}
      disableGutters
    >
      <AccordionSummary
        expandIcon={showComplete && <ExpandMoreIcon />}
        sx={{ '& .MuiSvgIcon-root': { color: borderColor } }}
      >
        <Typography sx={{ color: borderColor }}>{summary}</Typography>
      </AccordionSummary>
      {showComplete && <AccordionDetails>{details}</AccordionDetails>}
    </Accordion>
  );
}

function TitleWithSource({ source, title }: { source?: string; title?: string }) {
  return (
    <Typography>
      <i>
        <strong>{source}</strong>
      </i>{' '}
      - &quot;{title}&quot;
    </Typography>
  );
}

function QuotedTitle({ title }: { title?: string }) {
  return <Typography>&quot;{title}&quot;</Typography>;
}

function WinnerDisplay({ winnerPlayer, winnerTeam }: { winnerPlayer: Player | null; winnerTeam: Team | null }) {
  const intl = useIntl();
  return (
    <Typography>
      🏅{' '}
      {winnerTeam && winnerPlayer ? (
        <span style={{ color: winnerTeam.color }}>
          {winnerPlayer.name} {winnerTeam.name !== winnerPlayer.name && `(${winnerTeam.name})`}
        </span>
      ) : (
        <span className="italic opacity-50">{intl.formatMessage(globalMessages.nobody)}</span>
      )}
    </Typography>
  );
}

/* ============================================================ */
/* Per-type accordion components                               */
/* ============================================================ */

function BasicRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.BASIC, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameBasicQuestion;
  const q = baseQuestion as BasicQuestion;
  const winnerPlayer = gq.winner.playerId ? (players.find((p) => p.id === gq.winner.playerId) ?? null) : null;
  const winnerTeam = gq.winner.teamId ? (teams.find((t) => t.id === gq.winner.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.BASIC, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <TitleWithSource source={q.source} title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function BlindtestRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.BLINDTEST, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameBlindtestQuestion;
  const q = baseQuestion as BlindtestQuestion;
  const winnerPlayer = gq.winner.playerId ? (players.find((p) => p.id === gq.winner.playerId) ?? null) : null;
  const winnerTeam = gq.winner.teamId ? (teams.find((t) => t.id === gq.winner.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {BlindtestQuestion.typeToEmoji(q.subtype ?? '')}
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.BLINDTEST, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <QuotedTitle title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function EmojiRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.EMOJI, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameEmojiQuestion;
  const q = baseQuestion as EmojiQuestion;
  const winnerPlayer = gq.winner.playerId ? (players.find((p) => p.id === gq.winner.playerId) ?? null) : null;
  const winnerTeam = gq.winner.teamId ? (teams.find((t) => t.id === gq.winner.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.EMOJI, locale as Locale)} {order + 1}
          </strong>{' '}
          - {q.title}
        </span>
      }
      details={
        <>
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function EnumerationRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players: _players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(
    QuestionType.ENUMERATION,
    roundId,
    questionId
  );
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const q = baseQuestion as EnumerationQuestion;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={null}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.ENUMERATION, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <QuotedTitle title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={null} winnerTeam={null} />
        </>
      }
    />
  );
}

function EstimationRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams: _teams,
  players: _players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.ESTIMATION, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const q = baseQuestion as EstimationQuestion;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={null}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.ESTIMATION, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <QuotedTitle title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={null} winnerTeam={null} />
        </>
      }
    />
  );
}

function ImageRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.IMAGE, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameImageQuestion;
  const q = baseQuestion as ImageQuestion;
  const winnerPlayer = gq.winner.playerId ? (players.find((p) => p.id === gq.winner.playerId) ?? null) : null;
  const winnerTeam = gq.winner.teamId ? (teams.find((t) => t.id === gq.winner.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.IMAGE, locale as Locale)} {order + 1}
          </strong>{' '}
          - {q.title}
        </span>
      }
      details={
        <>
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function LabellingRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams: _teams,
  players: _players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.LABELLING, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const q = baseQuestion as LabellingQuestion;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={null}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.LABELLING, locale as Locale)} {order + 1}
          </strong>{' '}
          ({(q.labels ?? []).length} pts)
        </span>
      }
      details={
        <>
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={null} winnerTeam={null} />
        </>
      }
    />
  );
}

function MatchingRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams: _teams,
  players: _players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.MATCHING, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const q = baseQuestion as MatchingQuestion;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={null}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.MATCHING, locale as Locale)} {order + 1}
          </strong>{' '}
          ({q.numCols} col)
        </span>
      }
      details={
        <>
          <QuotedTitle title={q.title} />
          <QuestionCardContent baseQuestion={q} />
        </>
      }
    />
  );
}

function MCQRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.MCQ, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameMCQQuestion;
  const q = baseQuestion as MCQQuestion;
  const winnerPlayer = gq.correct && gq.playerId ? (players.find((p) => p.id === gq.playerId) ?? null) : null;
  const winnerTeam = gq.correct && gq.teamId ? (teams.find((t) => t.id === gq.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.MCQ, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <TitleWithSource source={q.source} title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function NaguiRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.NAGUI, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameNaguiQuestion;
  const q = baseQuestion as NaguiQuestion;
  const winnerPlayer = gq.correct && gq.playerId ? (players.find((p) => p.id === gq.playerId) ?? null) : null;
  const winnerTeam = gq.correct && gq.teamId ? (teams.find((t) => t.id === gq.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.NAGUI, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <TitleWithSource source={q.source} title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function OddOneOutRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams: _teams,
  players: _players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(
    QuestionType.ODD_ONE_OUT,
    roundId,
    questionId
  );
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const q = baseQuestion as OddOneOutQuestion;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={null}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.ODD_ONE_OUT, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <QuotedTitle title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={null} winnerTeam={null} />
        </>
      }
    />
  );
}

function ProgressiveCluesRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(
    QuestionType.PROGRESSIVE_CLUES,
    roundId,
    questionId
  );
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameProgressiveCluesQuestion;
  const q = baseQuestion as ProgressiveCluesQuestion;
  const winnerPlayer = gq.winner.playerId ? (players.find((p) => p.id === gq.winner.playerId) ?? null) : null;
  const winnerTeam = gq.winner.teamId ? (teams.find((t) => t.id === gq.winner.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.PROGRESSIVE_CLUES, locale as Locale)} {order + 1}
          </strong>{' '}
          - {q.title}
        </span>
      }
      details={
        <>
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function QuoteRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.QUOTE, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const gq = gameQuestion as GameQuoteQuestion;
  const q = baseQuestion as QuoteQuestion;
  const winnerPlayer = gq.winner.playerId ? (players.find((p) => p.id === gq.winner.playerId) ?? null) : null;
  const winnerTeam = gq.winner.teamId ? (teams.find((t) => t.id === gq.winner.teamId) ?? null) : null;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={winnerTeam}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.QUOTE, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} />
        </>
      }
    />
  );
}

function ReorderingRoundQuestionAccordion({
  game,
  roundId,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams: _teams,
  players: _players,
}: TypedAccordionProps) {
  const { locale } = useIntl();
  const { gameQuestion, baseQuestion, loading, error } = useRoundQuestion(QuestionType.REORDERING, roundId, questionId);
  const { showComplete, disabled } = useAccordionState(game, isCurrent, hasEnded, hasNotStarted);

  if (error) return <></>;
  if (loading) return <CircularProgress />;
  if (!gameQuestion || !baseQuestion) return <></>;

  const q = baseQuestion as ReorderingQuestion;

  return (
    <AccordionShell
      expanded={expanded}
      disabled={disabled}
      isCurrent={isCurrent}
      hasNotStarted={hasNotStarted}
      showComplete={showComplete}
      winnerTeam={null}
      onAccordionChange={onAccordionChange}
      game={game}
      summary={
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(QuestionType.REORDERING, locale as Locale)} {order + 1}
          </strong>
        </span>
      }
      details={
        <>
          <QuotedTitle title={q.title} />
          <QuestionCardContent baseQuestion={q} />
          <Divider className="my-2 bg-slate-600" />
          <WinnerDisplay winnerPlayer={null} winnerTeam={null} />
        </>
      }
    />
  );
}
