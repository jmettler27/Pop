import { GameStatus } from '@/backend/models/games/GameStatus';
import { QuestionType } from '@/backend/models/questions/QuestionType';

import { getRandomElement } from '@/backend/utils/arrays';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import globalMessages from '@/i18n/globalMessages';

import useGame from '@/frontend/hooks/useGame';
import { WinnerName } from '@/frontend/components/game/PlayerName';
import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';

const messages = defineMessages('frontend.game.BuzzerAnswer', {
  winnerText1: 'GG',
  winnerText2: 'Congrats',
  winnerText3: 'Hats off',
  winnerText4: 'Well done',
});

const WINNER_TEXT_KEYS = ['winnerText1', 'winnerText2', 'winnerText3', 'winnerText4'];

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
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <p>{intl.formatMessage(globalMessages.loading)}</p>;
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

  const key = getRandomElement(WINNER_TEXT_KEYS);
  const winnerText = intl.formatMessage(messages[key]);

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
