import { memo, useEffect, useState } from 'react';
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
import { BlindtestQuestion } from '@/models/questions/blindtest';
import { QuestionType, questionTypeToTitle } from '@/models/questions/question-type';
import { AnyBaseQuestion } from '@/models/questions/QuestionFactory';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';
import Team from '@/models/team';
import { Topic, topicToEmoji } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';
import { Player } from '@/models/users/player';

interface RoundQuestionsProgressProps {
  game: GameRounds;
  round: AnyRound;
}

export default function RoundQuestionsProgress({ game, round }: RoundQuestionsProgressProps) {
  const [expandedId, setExpandedId] = useState<string | null>(game.currentQuestion ?? null);

  // Expand the question's accordion whenever the current question changes or the game status changes (question start -> question_end)
  useEffect(() => {
    if (game.status === GameStatus.ROUND_START || game.status === GameStatus.ROUND_END) {
      setExpandedId(null);
    } else {
      setExpandedId(game.currentQuestion ?? null);
    }
  }, [game.currentQuestion, game.status]);

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo, playerRepo } = gameRepositories;

  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeamsOnce();
  const { players, loading: playersLoading, error: playersError } = playerRepo.useAllPlayersOnce();

  if (teamsError || playersError) {
    return <></>;
  }

  if (teamsLoading || playersLoading) {
    return <CircularProgress />;
  }

  if (!teams || !players) {
    return <></>;
  }

  const isExpanded = (questionId: string) => expandedId === questionId;

  const handleAccordionChange = (questionId: string) => {
    setExpandedId(isExpanded(questionId) ? null : questionId);
  };

  const currentRoundQuestionIdx = (game.currentQuestion ? round.currentQuestionIdx : -1) ?? -1;
  const hasEnded = (idx: number) => idx < currentRoundQuestionIdx;
  const isCurrent = (idx: number) => idx === currentRoundQuestionIdx;
  const hasNotStarted = (idx: number) => idx > currentRoundQuestionIdx;

  return (
    <div className="w-full mt-4 px-2 space-y-2">
      {round.questions.map((questionId: string, idx: number) => (
        <RoundQuestionAccordion
          key={questionId}
          roundId={round.id as string}
          roundType={round.type as string}
          questionId={questionId}
          order={idx}
          hasEnded={hasEnded(idx)}
          isCurrent={isCurrent(idx)}
          hasNotStarted={hasNotStarted(idx)}
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

interface RoundQuestionAccordionProps {
  game: GameRounds;
  roundId: string;
  roundType: RoundType;
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

export const RoundQuestionAccordion = memo(function RoundQuestionAccordion({
  game,
  roundId,
  roundType,
  questionId,
  order,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  teams,
  players,
}: RoundQuestionAccordionProps) {
  const { id } = useParams();
  const gameId = id as string;
  const myRole = useRole();

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    roundType as QuestionType,
    gameId as string,
    roundId
  );
  const baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(roundType as QuestionType);

  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(questionId);
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(questionId);

  if (gameQuestionError || baseQuestionError) {
    return <></>;
  }
  if (gameQuestionLoading || baseQuestionLoading) {
    return <CircularProgress />;
  }
  if (!gameQuestion || !baseQuestion) {
    return <></>;
  }

  const showComplete =
    myRole === ParticipantRole.ORGANIZER ||
    (isCurrent && game.status === GameStatus.QUESTION_END) ||
    hasEnded ||
    game.status === GameStatus.ROUND_END;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gq = gameQuestion as any;

  const winnerPlayerData = (questionType: QuestionType) => {
    if (questionType === 'mcq' || questionType === 'nagui') {
      if (!gq.correct) return null;
      return players.find((player) => player.id === gq.playerId);
    }
    if (!gq.winner) return null;
    return players.find((player) => player.id === gq.winner.playerId) ?? null;
  };

  const winnerTeamData = (questionType: QuestionType) => {
    if (questionType === 'mcq' || questionType === 'nagui') {
      if (!gq.correct) return null;
      return teams.find((team) => team.id === gq.teamId);
    }
    if (!gq.winner) return null;
    return teams.find((team) => team.id === gq.winner.teamId) ?? null;
  };

  const winnerPlayer = winnerPlayerData(baseQuestion.type as QuestionType) ?? null;
  const winnerTeam = winnerTeamData(baseQuestion.type as QuestionType) ?? null;

  const borderColor = () => {
    if (hasNotStarted) return '#6b7280';
    if (showComplete) {
      if (!winnerTeam) return 'inherit';
      return winnerTeam.color;
    }
  };

  const borderWidth = () => {
    return isCurrent ? '2px' : '1px';
  };

  const summaryColor = () => {
    if (hasNotStarted) return '#6b7280';
    if (showComplete) {
      if (!winnerTeam) return 'inherit';
      return winnerTeam.color;
    }
  };

  const isDisabled = () => {
    if (myRole === ParticipantRole.ORGANIZER) return false;
    return hasNotStarted;
  };

  return (
    <Accordion
      key={questionId}
      expanded={expanded}
      onChange={onAccordionChange}
      disabled={isDisabled()}
      className={clsx('rounded-lg', isCurrent && game.status === GameStatus.QUESTION_ACTIVE && 'glow-border-white')}
      elevation={0}
      sx={{
        borderWidth: borderWidth(),
        borderStyle: 'solid',
        borderColor: borderColor(),
        backgroundColor: 'inherit',
        color: 'inherit',
      }}
      disableGutters
    >
      <AccordionSummary
        expandIcon={showComplete && <ExpandMoreIcon />}
        sx={{
          '& .MuiSvgIcon-root': {
            color: borderColor(),
          },
        }}
      >
        <Typography sx={{ color: summaryColor() }}>
          <RoundQuestionSummary roundType={roundType} question={baseQuestion} order={order} />
        </Typography>
      </AccordionSummary>

      {showComplete && (
        <AccordionDetails>
          <QuestionTitle question={baseQuestion} />
          <QuestionCardContent baseQuestion={baseQuestion} />
          <Divider className="my-2 bg-slate-600" />
          <QuestionWinner question={baseQuestion} winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} game={game} />
        </AccordionDetails>
      )}
    </Accordion>
  );
});

/* ============================================================================================ */
interface RoundQuestionSummaryProps {
  roundType: RoundType;
  question: AnyBaseQuestion;
  order: number;
}

function RoundQuestionSummary({ roundType: _roundType, question, order }: RoundQuestionSummaryProps) {
  const intl = useIntl();
  const lang = intl.locale as Locale;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = question as any;

  switch (question.type) {
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.PROGRESSIVE_CLUES:
      return (
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>{' '}
          - {q.title}
        </span>
      );
    case QuestionType.BLINDTEST:
      return (
        <span className="text-lg">
          {BlindtestQuestion.typeToEmoji(q.subtype)}
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>
        </span>
      );
    case QuestionType.LABELLING:
      return (
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>{' '}
          ({(q.labels as unknown[]).length} pts)
        </span>
      );
    case QuestionType.MATCHING:
      return (
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>{' '}
          ({q.numCols} col)
        </span>
      );
    default:
      return (
        <span className="text-lg">
          {topicToEmoji(q.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>
        </span>
      );
  }
}

/* ============================================================================================ */
function QuestionTitle({ question }: { question: AnyBaseQuestion }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = question as any;
  switch (question.type) {
    case QuestionType.BASIC:
    case QuestionType.MCQ:
    case QuestionType.NAGUI:
      return <QuestionTitleWithSource question={q} />;
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.LABELLING:
    case QuestionType.PROGRESSIVE_CLUES:
    case QuestionType.QUOTE:
      return <></>;
    default:
      return <Typography>&quot;{q.title}&quot;</Typography>;
  }
}

function QuestionTitleWithSource({ question }: { question: { source?: string; title?: string } }) {
  return (
    <Typography>
      <i>
        <strong>{question.source}</strong>
      </i>{' '}
      - &quot;{question.title}&quot;
    </Typography>
  );
}

/* ============================================================================================ */
interface QuestionWinnerProps {
  winnerTeam: Team | null;
  winnerPlayer: Player | null;
  question: AnyBaseQuestion;
  game: GameRounds;
}

function QuestionWinner({ winnerTeam, winnerPlayer, question, game }: QuestionWinnerProps) {
  const intl = useIntl();
  switch (question.type) {
    case QuestionType.MATCHING:
      return <></>;
    default:
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
}
