import { useIntl } from 'react-intl';

import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import PlayerName from '@/frontend/components/game/PlayerName';
import { rankingToEmoji } from '@/frontend/helpers/emojis';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';

const messages = defineMessages('frontend.game.bottom.EnumerationPlayers', {
  betsHeader: 'Bets',
});

export default function EnumerationPlayers() {
  const intl = useIntl();
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameEnumerationQuestionRepository(game.id as string, game.currentRound as string);
  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = gameQuestionRepo.useQuestionPlayers(game.currentQuestion as string);

  if (playersError || playersLoading || !questionPlayers) {
    return <></>;
  }

  const bets = ((questionPlayers as { bets?: Array<{ playerId: string; bet: number }> }).bets ?? []).sort(
    (a, b) => b.bet - a.bet
  );

  return (
    <div className="flex flex-row h-full w-full">
      {bets.length > 0 && (
        <div className="flex flex-col h-full w-full justify-start p-2">
          <h2 className="font-bold">{intl.formatMessage(messages.betsHeader)}</h2>
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
