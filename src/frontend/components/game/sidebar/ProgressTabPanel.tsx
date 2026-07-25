import { useState } from 'react';
import { useParams } from 'next/navigation';

import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useIntl } from 'react-intl';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import GlobalProgressTabPanel from '@/frontend/components/game/sidebar/GlobalProgressTabPanel';
import RoundProgressTabPanel from '@/frontend/components/game/sidebar/RoundProgressTabPanel';
import { Spinner } from '@/frontend/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/frontend/components/ui/tabs';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameStatus } from '@/models/games/game-status';

export default function ProgressTabPanel() {
  const { id } = useParams();
  const gameId = id as string;

  const gameRef = doc(GAMES_COLLECTION_REF, gameId as string);
  const [gameDoc, gameDocLoading, gameDocError] = useDocument(gameRef);
  if (gameDocError) {
    return <></>;
  }
  if (gameDocLoading) {
    return <Spinner />;
  }
  if (!gameDoc) {
    return <></>;
  }
  const game = { id: gameDoc.id, ...gameDoc.data() } as Record<string, unknown>;

  return <ProgressTabPanelMainContent game={game} />;
}

function ProgressTabPanelMainContent({ game }: { game: Record<string, unknown> }) {
  const [value, setValue] = useState<'game' | 'round'>('game');
  const intl = useIntl();

  const [prevGameStatus, setPrevGameStatus] = useState(game.status);
  const [prevGameCurrentRound, setPrevGameCurrentRound] = useState(game.currentRound);
  if (game.status !== prevGameStatus || game.currentRound !== prevGameCurrentRound) {
    setPrevGameStatus(game.status);
    setPrevGameCurrentRound(game.currentRound);
    setValue(!game.currentRound || game.status === 'game_home' ? 'game' : 'round');
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
            <GlobalProgressTabPanel game={game as unknown as Parameters<typeof GlobalProgressTabPanel>[0]['game']} />
          </TabsContent>
        )}

        {game.type === 'rounds' &&
          !!game.currentRound &&
          (game.status === GameStatus.ROUND_START ||
            game.status === GameStatus.ROUND_END ||
            game.status === GameStatus.QUESTION_ACTIVE ||
            game.status === GameStatus.QUESTION_END) && (
            <TabsContent value="round">
              <RoundProgressTabPanel game={game as unknown as Parameters<typeof RoundProgressTabPanel>[0]['game']} />
            </TabsContent>
          )}
      </Tabs>
    </div>
  );
}
