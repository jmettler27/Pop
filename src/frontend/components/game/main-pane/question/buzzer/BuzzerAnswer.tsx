import { useIntl } from 'react-intl';

import GameQuestionRepositoryFactory from '@/backend/repositories/question/GameQuestionRepositoryFactory';
import { getRandomElement } from '@/backend/utils/arrays';
import { WinnerName } from '@/frontend/components/game/PlayerName';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { BuzzerQuestion } from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.BuzzerAnswer', {
  winnerText1: 'GG',
  winnerText2: 'Congrats',
  winnerText3: 'Hats off',
  winnerText4: 'Well done',
});

const WINNER_TEXT_KEYS = ['winnerText1', 'winnerText2', 'winnerText3', 'winnerText4'];

interface BuzzerAnswerProps {
  baseQuestion: BuzzerQuestion;
}

export default function BuzzerAnswer({ baseQuestion }: BuzzerAnswerProps) {
  return (
    <div className="flex flex-col h-full items-center">
      <BuzzerAnswerText baseQuestion={baseQuestion} />
      <BuzzerWinnerInfo baseQuestion={baseQuestion} />
    </div>
  );
}

function BuzzerAnswerText({ baseQuestion }: BuzzerAnswerProps) {
  const bq = baseQuestion as { answer?: { title?: string }; type?: QuestionType };
  const answer = bq.answer;

  switch (bq.type) {
    case QuestionType.PROGRESSIVE_CLUES:
      return <span className="2xl:text-4xl font-bold text-green-500">{answer?.title}</span>;
    default:
      return <></>;
  }
}

function BuzzerWinnerInfo({ baseQuestion }: BuzzerAnswerProps) {
  const game = useGame();
  if (!game) return null;
  const intl = useIntl();
  const bq = baseQuestion as { type?: QuestionType };

  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;
  const gameQuestionRepo = GameQuestionRepositoryFactory.createRepository(
    bq.type as QuestionType,
    game.id as string,
    currentRound as string
  );
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <p>{intl.formatMessage(globalMessages.loading)}</p>;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const gq = gameQuestion as { winner?: { playerId?: string; teamId?: string } };

  if (!(gq.winner && game.status === GameStatus.QUESTION_END)) {
    return <></>;
  }

  if (!gq.winner || !gq.winner.playerId || !gq.winner.teamId) {
    return <></>;
  }

  const key = getRandomElement(WINNER_TEXT_KEYS) as keyof typeof messages;
  const winnerText = intl.formatMessage(messages[key]);

  return (
    <span className="2xl:text-3xl">
      {winnerText}{' '}
      <strong>
        <WinnerName playerId={gq.winner.playerId} teamId={gq.winner.teamId} />
      </strong>
      ! 🥳
    </span>
  );
}
