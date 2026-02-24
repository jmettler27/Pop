import { rankingToEmoji } from '@/backend/utils/emojis';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/game/GameEnumerationQuestionRepository';

import { useGameContext } from '@/frontend/contexts';

import PlayerName from '@/frontend/components/game/PlayerName';

export default function EnumerationPlayers({ lang = DEFAULT_LOCALE }) {
  const game = useGameContext();

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
    return <></>;
  }
  if (!questionPlayers) {
    return <></>;
  }

  const bets = questionPlayers.bets.sort((a, b) => b.bet - a.bet);

  return (
    <div className="flex flex-row h-full w-full">
      {bets.length > 0 && (
        <div className="flex flex-col h-full w-full justify-start p-2">
          <h2 className="font-bold">{BETS_HEADER[lang]}</h2>
          <ol className="overflow-auto">
            {bets.map((bet, index) => {
              return (
                <li key={index}>
                  {rankingToEmoji(index)} <PlayerName playerId={bet.playerId} teamColor={false} />: {bet.bet}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

const BETS_HEADER = {
  en: 'Bets',
  'fr-FR': 'Paris',
};
