import { useIntl } from 'react-intl';

import PlayerName from '@/components/game/PlayerName';
import { rankingToEmoji } from '@/helpers/emojis';
import { useQuestionPlayers } from '@/hooks/firestore/question/useGameQuestionHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import defineMessages from '@/i18n/defineMessages';

const messages = defineMessages('frontend.game.bottom.EnumerationPlayers', {
  betsHeader: 'Bets',
});

export default function EnumerationPlayers() {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const {
    data: questionPlayers,
    loading: playersLoading,
    error: playersError,
  } = useQuestionPlayers(gameId, roundId, questionId);

  if (playersError || playersLoading || !questionPlayers) {
    return <></>;
  }

  const bets = ((questionPlayers as { bets?: Array<{ playerId: string; bet: number }> }).bets ?? [])
    .filter((bet) => !!bet.playerId)
    .sort((a, b) => b.bet - a.bet);

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
