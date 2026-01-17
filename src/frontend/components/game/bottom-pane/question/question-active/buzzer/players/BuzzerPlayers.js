import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { useGameRepositoriesContext } from '@/frontend/contexts';
import { rankingToEmoji } from '@/backend/utils/emojis';

export default function BuzzerPlayers({ players, lang = DEFAULT_LOCALE }) {
  const { playerRepo } = useGameRepositoriesContext();
  const { gamePlayers, gamePlayersLoading, gamePlayersError } = playerRepo.useAllPlayersOnce();

  if (gamePlayersError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gamePlayersError)}</strong>
      </p>
    );
  }
  if (gamePlayersLoading) {
    return <></>;
  }
  if (!gamePlayers) {
    return <></>;
  }
  if (gamePlayersLoading) {
    return <></>;
  }
  if (!gamePlayers) {
    return <></>;
  }

  const buzzed = players.buzzed;
  const canceled = players.canceled;

  return (
    <div className="flex flex-row h-full w-full">
      {/* Players who are in the buzzed list */}
      <div className="flex flex-col h-full w-1/2 justify-start p-2">
        <h2 className="font-bold text-xl">{BUZZED_TEXT[lang]}</h2>
        {buzzed && buzzed.length > 0 ? (
          <BuzzedPlayers buzzed={buzzed} gamePlayers={gamePlayers} />
        ) : (
          <p className="2xl:text-xl italic opacity-50">{NO_BUZZERS[lang]}</p>
        )}
      </div>

      {/* Players who are in the canceled list */}
      {canceled && canceled.length > 0 && (
        <div className="flex flex-col h-full w-1/2 justify-start p-2">
          <h2 className="font-bold text-xl">{CANCELED_TEXT[lang]}</h2>
          <CanceledPlayers canceled={canceled} gamePlayers={gamePlayers} />
        </div>
      )}
    </div>
  );
}

const NO_BUZZERS = {
  en: 'Nobody',
  'fr-FR': 'y a personne',
};

const BUZZED_TEXT = {
  en: 'Buzzers',
  'fr-FR': 'Buzzeurs',
};

const CANCELED_TEXT = {
  en: 'N00bs',
  'fr-FR': 'Nullos',
};

function getPlayerName(gamePlayers, playerId) {
  return gamePlayers.find((p) => p.id === playerId).name;
}

function BuzzedPlayers({ buzzed, gamePlayers }) {
  return (
    <ol className="overflow-auto">
      {buzzed.map((playerId, index) => (
        <li key={index} className="2xl:text-xl">
          {rankingToEmoji(index)} {getPlayerName(gamePlayers, playerId)}
        </li>
      ))}
    </ol>
  );
}

function CanceledPlayers({ canceled, gamePlayers }) {
  return (
    <ol className="overflow-auto">
      {canceled.map((item, index) => (
        <li key={index} className="2xl:text-xl">
          💩 {getPlayerName(gamePlayers, item.playerId)} {item.clueIdx >= 0 && `(#${item.clueIdx + 1})`}
        </li>
      ))}
    </ol>
  );
}
