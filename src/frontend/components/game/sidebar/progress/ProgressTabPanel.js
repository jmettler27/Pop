import { useEffect, useState } from 'react';

import { Box, Tab, Tabs } from '@mui/material';
import { useIntl } from 'react-intl';

import GlobalProgressTabPanel from '@/frontend/components/game/sidebar/progress/GlobalProgressTabPanel';
import RoundProgressTabPanel from '@/frontend/components/game/sidebar/progress/round/RoundProgressTabPanel';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameStatus } from '@/models/games/GameStatus';

export default function ProgressTabPanel({}) {
  const game = useGame();

  if (!game) return <></>;

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
          <Tab label={intl.formatMessage(globalMessages.game)} aria-label="game progress" {...a11yProps(0)} />
          {/* {(game.type === 'rounds' && game.currentRound) && ( */}
          <Tab label={intl.formatMessage(globalMessages.round)} aria-label="round progress" {...a11yProps(1)} />
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
          game.status === GameStatus.QUESTION_END) && (
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
