import { QuestionType, questionTypeToEmoji, questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { UserRole } from '@/backend/models/users/User';
import { topicToEmoji } from '@/backend/models/Topic';
import { BlindtestQuestion } from '@/backend/models/questions/Blindtest';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc, collection } from 'firebase/firestore';
import { useCollectionOnce, useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { useRoleContext, useGameRepositoriesContext } from '@/frontend/contexts';

import { QuestionCardContent } from '@/frontend/components/questions/QuestionCard';

import { useParams } from 'next/navigation';

import { useState, useEffect, memo } from 'react';

import { CircularProgress, Accordion, AccordionSummary, AccordionDetails, Typography, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import clsx from 'clsx';

export default function RoundQuestionsProgress({ game, round }) {
  const [expandedId, setExpandedId] = useState(game.currentQuestion);

  // Expand the question's accordion whenever the current question changes or the game status changes (question start -> question_end)
  useEffect(() => {
    if (game.status === GameStatus.ROUND_START || game.status === GameStatus.ROUND_END) {
      setExpandedId(false);
    } else {
      setExpandedId(game.currentQuestion);
    }
  }, [game.currentQuestion, game.status]);

  const { teamRepo, playerRepo } = useGameRepositoriesContext();

  const { teams, teamsLoading, teamsError } = teamRepo.useAllTeamsOnce(game.id);
  const { players, playersLoading, playersError } = playerRepo.useAllPlayersOnce(game.id);

  if (teamsError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(teamsError)}</strong>
      </p>
    );
  }
  if (playersError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(playersError)}</strong>
      </p>
    );
  }

  if (teamsLoading || playersLoading) {
    return <CircularProgress />;
  }

  if (!teams || !players) {
    return <></>;
  }

  const isExpanded = (questionId) => expandedId === questionId;

  const handleAccordionChange = (questionId) => {
    setExpandedId(isExpanded(questionId) ? false : questionId);
  };

  const currentRoundQuestionIdx = game.currentQuestion ? round.currentQuestionIdx : -1;
  const hasEnded = (idx) => idx < currentRoundQuestionIdx;
  const isCurrent = (idx) => idx === currentRoundQuestionIdx;
  const hasNotStarted = (idx) => idx > currentRoundQuestionIdx;

  return (
    <div className="w-full mt-4 px-2 space-y-2">
      {round.questions.map((questionId, idx) => (
        <RoundQuestionAccordion
          key={questionId}
          roundId={round.id}
          roundType={round.type}
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
}) {
  console.log('RoundQuestionAccordion', questionId, order, expanded);
  const { id: gameId } = useParams();
  const myRole = useRoleContext();

  const gameQuestionRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'questions', questionId);
  const [gameQuestion, gameQuestionLoading, gameQuestionError] = useDocumentData(gameQuestionRef);

  const baseQuestionRef = doc(QUESTIONS_COLLECTION_REF, questionId);
  const [baseQuestion, baseQuestionLoading, baseQuestionError] = useDocumentDataOnce(baseQuestionRef);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (baseQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(baseQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading || baseQuestionLoading) {
    return <CircularProgress />;
  }
  if (!gameQuestion || !baseQuestion) {
    return <></>;
  }

  const showComplete =
    myRole === UserRole.ORGANIZER ||
    (isCurrent && game.status === GameStatus.QUESTION_END) ||
    hasEnded ||
    game.status === GameStatus.ROUND_END;

  const winnerPlayerData = (questionType) => {
    if (questionType === 'mcq' || questionType === 'nagui') {
      if (!gameQuestion.correct) return null;
      return players.find((player) => player.id === gameQuestion.playerId);
    }
    if (!gameQuestion.winner) return null;
    return players.find((player) => player.id === gameQuestion.winner.playerId);
  };

  const winnerTeamData = (questionType) => {
    if (questionType === 'mcq' || questionType === 'nagui') {
      if (!gameQuestion.correct) return null;
      return teams.find((team) => team.id === gameQuestion.teamId);
    }
    if (!gameQuestion.winner) return null;
    return teams.find((team) => team.id === gameQuestion.winner.teamId);
  };

  const winnerPlayer = winnerPlayerData(baseQuestion.type);
  const winnerTeam = winnerTeamData(baseQuestion.type);

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
    if (myRole === UserRole.ORGANIZER) return false;
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
          <QuestionCardContent question={baseQuestion} />
          <Divider className="my-2 bg-slate-600" />
          <QuestionWinner question={baseQuestion} winnerPlayer={winnerPlayer} winnerTeam={winnerTeam} game={game} />
        </AccordionDetails>
      )}
    </Accordion>
  );
});

/* ============================================================================================ */
function RoundQuestionSummary({ roundType, question, order, lang = DEFAULT_LOCALE }) {
  if (roundType === 'mixed') {
    return (
      <span className="text-lg">
        {questionTypeToEmoji(question.type)} {topicToEmoji(question.topic)} <strong>Question {order + 1}</strong>
      </span>
    );
  }

  switch (question.type) {
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.PROGRESSIVE_CLUES:
      return (
        <span className="text-lg">
          {topicToEmoji(question.topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>{' '}
          - {question.details.title}
        </span>
      );
    case QuestionType.BLINDTEST:
      return (
        <span className="text-lg">
          {BlindtestQuestion.typeToEmoji(question.details.subtype)}
          {topicToEmoji(question.topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>
        </span>
      );
    case QuestionType.LABELLING:
      return (
        <span className="text-lg">
          {topicToEmoji(question.topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>{' '}
          ({question.details.labels.length} pts)
        </span>
      );
    case QuestionType.MATCHING:
      return (
        <span className="text-lg">
          {topicToEmoji(question.topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>{' '}
          ({question.details.numCols} col)
        </span>
      );
    default:
      return (
        <span className="text-lg">
          {topicToEmoji(question.topic)}{' '}
          <strong>
            {questionTypeToTitle(question.type, lang)} {order + 1}
          </strong>
        </span>
      );
  }
}

/* ============================================================================================ */
function QuestionTitle({ question }) {
  switch (question.type) {
    case QuestionType.BASIC:
    case QuestionType.MCQ:
    case QuestionType.NAGUI:
      return <QuestionTitleWithSource question={question} />;
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.LABELLING:
    case QuestionType.PROGRESSIVE_CLUES:
    case QuestionType.QUOTE:
      return <></>;
    default:
      return <Typography>&quot;{question.details.title}&quot;</Typography>;
  }
}

function QuestionTitleWithSource({ question }) {
  return (
    <Typography>
      <i>
        <strong>{question.details.source}</strong>
      </i>{' '}
      - &quot;{question.details.title}&quot;
    </Typography>
  );
}

/* ============================================================================================ */
function QuestionWinner({ winnerTeam, winnerPlayer, question, game, lang = DEFAULT_LOCALE }) {
  switch (question.type) {
    case QuestionType.ENUMERATION:
      return <EnumQuestionWinner winnerTeam={winnerTeam} winnerPlayer={winnerPlayer} question={question} game={game} />;
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
            <span className="italic opacity-50">{NO_WINNER_TEXT[lang]}</span>
          )}
        </Typography>
      );
  }
}

function EnumQuestionWinner({ winnerTeam, winnerPlayer, question, game, lang = DEFAULT_LOCALE }) {
  return <></>;
  // const questionPlayersRef = doc(GAMES_COLLECTION_REF, gameIdds', roundId, 'questions', question.id, 'realtime', 'players')
  // const [players, playersLoading, playersError] = useDocumentDataOnce(questionPlayersRef)
  // if (playersError) {
  //     return <p><strong>Error: {JSON.stringify(playersError)}</strong></p>
  // }
  // if (playersLoading) {
  //     return <CircularProgress />
  // }
  // if (!players) {
  //     return <></>
  // }
  // const challenger = players.challenger
  // const bet = challenger?.bet
  // const numCited = challenger?.cited.length

  // return (
  //     <Typography>
  //         🏅 {winnerTeam ?
  //             <span style={{ color: winnerTeam.color }}>{winnerPlayer.name} {winnerTeam.teamAllowed && `(${winnerTeam.name})`}: {numCited}/{bet}</span> :
  //             <span className='italic opacity-50'>{NO_WINNER_TEXT[lang]} {players.challenger && <span className='text-red-500'>({numCited}/{bet})</span>}</span>
  //         }
  //     </Typography>
  // )
}

const NO_WINNER_TEXT = {
  en: 'Nobody',
  'fr-FR': 'Personne',
};
