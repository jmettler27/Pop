import { useState } from 'react';

import { useIntl } from 'react-intl';

import GlobalProgressTabPanel from '@/components/game/sidebar/GlobalProgressTabPanel';
import RoundProgressTabPanel from '@/components/game/sidebar/RoundProgressTabPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useGame from '@/hooks/useGame';
import globalMessages from '@/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';

export default function ProgressTabPanel() {
  const game = useGame();
  if (!game) return null;

  return <ProgressTabPanelMainContent game={game} />;
}

function ProgressTabPanelMainContent({ game }: { game: GameRounds }) {
  const [value, setValue] = useState<'game' | 'round'>('game');
  const intl = useIntl();

  const [prevGameStatus, setPrevGameStatus] = useState(game.status);
  const [prevGameCurrentRound, setPrevGameCurrentRound] = useState(game.currentRound);
  if (game.status !== prevGameStatus || game.currentRound !== prevGameCurrentRound) {
    setPrevGameStatus(game.status);
    setPrevGameCurrentRound(game.currentRound);
    setValue(!game.currentRound || game.status === GameStatus.GAME_HOME ? 'game' : 'round');
  }

  return (
    <div className="w-full">
      <Tabs value={value} onValueChange={(newValue) => setValue(newValue as 'game' | 'round')}>
        {/* Sidebar tabs */}
        <div className="border-b border-border">
          <TabsList className="w-full" aria-label="sidebar tabs">
            <TabsTrigger value="game" aria-label="game progress">
              {intl.formatMessage(globalMessages.game)}
            </TabsTrigger>
            <TabsTrigger value="round" aria-label="round progress">
              {intl.formatMessage(globalMessages.round)}
            </TabsTrigger>
          </TabsList>
        </div>

        {game.status !== GameStatus.GAME_START && (
          <TabsContent value="game">
            <GlobalProgressTabPanel game={game} />
          </TabsContent>
        )}

        {!!game.currentRound &&
          (game.status === GameStatus.ROUND_START ||
            game.status === GameStatus.ROUND_END ||
            game.status === GameStatus.QUESTION_ACTIVE ||
            game.status === GameStatus.QUESTION_END) && (
            <TabsContent value="round">
              <RoundProgressTabPanel game={game} />
            </TabsContent>
          )}
      </Tabs>
    </div>
  );
}
