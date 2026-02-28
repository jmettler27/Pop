import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { useGameRepositoriesContext } from '@/frontend/contexts';
import { rankingToEmoji } from '@/backend/utils/emojis';

const messages = defineMessages('frontend.game.bottom.BuzzerPlayers', {
  buzzers: 'Buzzers',
  noBuzzers: 'Nobody',
  noobs: 'N00bs',
});

export default function BuzzerPlayers({ questionPlayers }) {
  const intl = useIntl();
  const { playerRepo } = useGameRepositoriesContext();
  const { players, loading, error } = playerRepo.useAllPlayersOnce();

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <></>;
  }
  if (!players) {
    console.error('BuzzerPlayers: players is null or undefined');
    return <></>;
  }

  const { buzzed, canceled } = questionPlayers;

  return (
    <div className="flex flex-row h-full w-full">
      {/* Players who are in the buzzed list */}
      <div className="flex flex-col h-full w-1/2 justify-start p-2">
        <h2 className="font-bold text-xl">{intl.formatMessage(messages.buzzers)}</h2>
        {buzzed && buzzed.length > 0 ? (
          <BuzzedPlayers buzzed={buzzed} players={players} />
        ) : (
          <p className="2xl:text-xl italic opacity-50">{intl.formatMessage(messages.noBuzzers)}</p>
        )}
      </div>

      {/* Players who are in the canceled list */}
      {canceled && canceled.length > 0 && (
        <div className="flex flex-col h-full w-1/2 justify-start p-2">
          <h2 className="font-bold text-xl">{intl.formatMessage(messages.noobs)}</h2>
          <CanceledPlayers canceled={canceled} players={players} />
        </div>
      )}
    </div>
  );
}

function getPlayerName(players, playerId) {
  return players.find((p) => p.id === playerId).name;
}

function BuzzedPlayers({ buzzed, players }) {
  return (
    <ol className="overflow-auto">
      {buzzed.map((playerId, index) => (
        <li key={index} className="2xl:text-xl">
          {rankingToEmoji(index)} {getPlayerName(players, playerId)}
        </li>
      ))}
    </ol>
  );
}

function CanceledPlayers({ canceled, players }) {
  console.log('CanceledPlayers', { canceled, players });
  return (
    <ol className="overflow-auto">
      {canceled.map((item, index) => (
        <li key={index} className="2xl:text-xl">
          💩 {getPlayerName(players, item.playerId)} {item.clueIdx >= 0 && `(#${item.clueIdx + 1})`}
        </li>
      ))}
    </ol>
  );
}
