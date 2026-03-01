import { useState, useEffect } from 'react';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';

import { Tabs, Tab, Box, CircularProgress } from '@mui/material';

import GlobalProgressTabPanel from '@/frontend/components/game/sidebar/progress/GlobalProgressTabPanel';
import RoundProgressTabPanel from '@/frontend/components/game/sidebar/progress/round/RoundProgressTabPanel';

import { useParams } from 'next/navigation';
import { GameStatus } from '@/backend/models/games/GameStatus';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.sidebar.progress.ProgressTabPanel', {
  game: 'Game',
  round: 'Round',
});
export default function ProgressTabPanel({}) {
  const { id: gameId } = useParams();

  const gameRef = doc(GAMES_COLLECTION_REF, gameId);
  const [gameDoc, gameDocLoading, gameDocError] = useDocument(gameRef);
  if (gameDocError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameDocError)}</strong>
      </p>
    );
  }
  if (gameDocLoading) {
    return <CircularProgress />;
  }
  if (!gameDoc) {
    return <></>;
  }
  const game = { id: gameDoc.id, ...gameDoc.data() };

  return <ProgressTabPanelMainContent game={game} />;
}

function ProgressTabPanelMainContent({ game }) {
  const [value, setValue] = useState(0);
  const intl = useIntl();

  useEffect(() => {
    if (!game.currentRound || game.status === 'game_home') {
      setValue(0);
      return;
    }
    setValue(1);
  }, [game.status, game.currentRound]);

  const handleChange = (event, newValue) => {
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
          <Tab label={intl.formatMessage(messages.game)} aria-label="game progress" {...a11yProps(0)} />
          {/* {(game.type === 'rounds' && game.currentRound) && ( */}
          <Tab label={intl.formatMessage(messages.round)} aria-label="round progress" {...a11yProps(1)} />
          {/* )} */}
        </Tabs>
      </Box>

      {game.status !== GameStatus.GAME_START && (
        <CustomTabPanel value={value} index={0}>
          <GlobalProgressTabPanel game={game} />
        </CustomTabPanel>
      )}

      {game.type === 'rounds' &&
        game.currentRound &&
        (game.status === GameStatus.ROUND_START ||
          game.status === GameStatus.ROUND_END ||
          game.status === GameStatus.QUESTION_ACTIVE ||
          game.status === GameStatus.QUESTION_END ||
          game.status === GameStatus.SPECIAL) && (
          <CustomTabPanel value={value} index={1}>
            <RoundProgressTabPanel game={game} />
          </CustomTabPanel>
        )}
    </Box>
  );
}

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
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

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
