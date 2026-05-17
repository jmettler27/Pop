import { useIntl } from 'react-intl';

import { rankingToEmoji } from '@/frontend/helpers/emojis';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { Player } from '@/models/users/player';

const messages = defineMessages('frontend.game.bottom.BuzzerPlayers', {
  buzzers: 'Buzzers',
  noobs: 'N00bs',
});

interface BuzzerPlayersProps {
  questionPlayers: Record<string, unknown>;
}

export default function BuzzerPlayers({ questionPlayers }: BuzzerPlayersProps) {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo } = gameRepositories;
  const { players, loading, error } = playerRepo.useAllPlayersOnce();

  if (error || loading || !players) {
    return <></>;
  }

  const { buzzed, canceled } = questionPlayers as {
    buzzed: string[];
    canceled: { playerId: string; clueIdx?: number }[];
  };

  return (
    <div className="flex flex-row h-full w-full">
      <div className="flex flex-col h-full w-1/2 justify-start p-2">
        <h2 className="font-bold text-xl">{intl.formatMessage(messages.buzzers)}</h2>
        {buzzed && buzzed.length > 0 ? (
          <BuzzedPlayers buzzed={buzzed} players={players} />
        ) : (
          <p className="2xl:text-xl italic opacity-50">{intl.formatMessage(globalMessages.nobody)}</p>
        )}
      </div>

      {canceled && canceled.length > 0 && (
        <div className="flex flex-col h-full w-1/2 justify-start p-2">
          <h2 className="font-bold text-xl">{intl.formatMessage(messages.noobs)}</h2>
          <CanceledPlayers canceled={canceled} players={players} />
        </div>
      )}
    </div>
  );
}

function getPlayerName(players: Player[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name ?? '';
}

interface BuzzedPlayersProps {
  buzzed: string[];
  players: Player[];
}

function BuzzedPlayers({ buzzed, players }: BuzzedPlayersProps) {
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

interface CanceledPlayersProps {
  canceled: { playerId: string; clueIdx?: number }[];
  players: Player[];
}

function CanceledPlayers({ canceled, players }: CanceledPlayersProps) {
  return (
    <ol className="overflow-auto">
      {canceled.map((item, index) => (
        <li key={index} className="2xl:text-xl">
          💩 {getPlayerName(players, item.playerId)} {(item.clueIdx ?? -1) >= 0 && `(#${(item.clueIdx ?? 0) + 1})`}
        </li>
      ))}
    </ol>
  );
}
