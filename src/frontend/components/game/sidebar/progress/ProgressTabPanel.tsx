import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { Box, CircularProgress, Tab, Tabs } from '@mui/material';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useIntl } from 'react-intl';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import GlobalProgressTabPanel from '@/frontend/components/game/sidebar/progress/GlobalProgressTabPanel';
import RoundProgressTabPanel from '@/frontend/components/game/sidebar/progress/round/RoundProgressTabPanel';
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
    return <CircularProgress />;
  }
  if (!gameDoc) {
    return <></>;
  }
  const game = { id: gameDoc.id, ...gameDoc.data() } as Record<string, unknown>;

  return <ProgressTabPanelMainContent game={game} />;
}

function ProgressTabPanelMainContent({ game }: { game: Record<string, unknown> }) {
  const [value, setValue] = useState(0);
  const intl = useIntl();

  useEffect(() => {
    if (!game.currentRound || game.status === 'game_home') {
      setValue(0);
      return;
    }
    setValue(1);
  }, [game.status, game.currentRound]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box className="w-full">
      {/* Sidebar tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="sidebar tabs"
          //
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
        >
          <Tab label={intl.formatMessage(globalMessages.game)} aria-label="game progress" {...a11yProps(0)} />
          {/* {(game.type === 'rounds' && game.currentRound) && ( */}
          <Tab label={intl.formatMessage(globalMessages.round)} aria-label="round progress" {...a11yProps(1)} />
          {/* )} */}
        </Tabs>
      </Box>

      {game.status !== GameStatus.GAME_START && (
        <CustomTabPanel value={value} index={0}>
          <GlobalProgressTabPanel game={game as unknown as Parameters<typeof GlobalProgressTabPanel>[0]['game']} />
        </CustomTabPanel>
      )}

      {game.type === 'rounds' &&
        !!game.currentRound &&
        (game.status === GameStatus.ROUND_START ||
          game.status === GameStatus.ROUND_END ||
          game.status === GameStatus.QUESTION_ACTIVE ||
          game.status === GameStatus.QUESTION_END) && (
          <CustomTabPanel value={value} index={1}>
            <RoundProgressTabPanel game={game as unknown as Parameters<typeof RoundProgressTabPanel>[0]['game']} />
          </CustomTabPanel>
        )}
    </Box>
  );
}

interface CustomTabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function CustomTabPanel({ children, value, index }: CustomTabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && (
        <Box>
          {/* sx={{ p: 3 }} */}
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
