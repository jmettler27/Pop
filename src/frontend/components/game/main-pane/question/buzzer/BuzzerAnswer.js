import { GameStatus } from '@/backend/models/games/GameStatus';
import { QuestionType } from '@/backend/models/questions/QuestionType';

import { getRandomElement } from '@/backend/utils/arrays';

import { useIntl } from 'react-intl';

import useGame from '@/frontend/hooks/useGame';
import { WinnerName } from '@/frontend/components/game/PlayerName';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';

export default function BuzzerAnswer({ baseQuestion }) {
  return (
    <div className="flex flex-col h-full items-center">
      <BuzzerAnswerText baseQuestion={baseQuestion} />
      <BuzzerWinnerInfo baseQuestion={baseQuestion} />
    </div>
  );
}

function BuzzerAnswerText({ baseQuestion }) {
  const answer = baseQuestion.answer;

  switch (baseQuestion.type) {
    case QuestionType.PROGRESSIVE_CLUES:
      return <span className="2xl:text-4xl font-bold text-green-500">{answer.title}</span>;
    default:
      return <></>;
  }
}

function BuzzerWinnerInfo({ baseQuestion }) {
  const game = useGame();
  const intl = useIntl();

  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    baseQuestion.type,
    game.id,
    game.currentRound
  );
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <p>Loading game question...</p>;
  }
  if (!gameQuestion) {
    return <></>;
  }

  if (!(gameQuestion.winner && game.status === GameStatus.QUESTION_END)) {
    return <></>;
  }

  if (!gameQuestion.winner || !gameQuestion.winner.playerId || !gameQuestion.winner.teamId) {
    return <></>;
  }

  const winnerText =
    intl.locale === 'fr' ? getRandomElement(BUZZER_WINNER_TEXT_FR) : getRandomElement(BUZZER_WINNER_TEXT_EN);

  return (
    <span className="2xl:text-3xl">
      {winnerText}{' '}
      <strong>
        <WinnerName playerId={gameQuestion.winner.playerId} teamId={gameQuestion.winner.teamId} />
      </strong>
      ! 🥳
    </span>
  );
}

const BUZZER_WINNER_TEXT_EN = ['GG', 'Congrats', 'Hats off', 'Well done'];

const BUZZER_WINNER_TEXT_FR = ['GG', 'Bravo', 'Félicitations', 'Chapeau', 'Bien joué', 'Super', 'Excellent', 'Parfait'];
