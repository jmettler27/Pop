import { UserRole } from '@/backend/models/users/User';

import { useRoleContext } from '@/frontend/contexts';
import { useLocale } from '@/app/LocaleProvider';
import { LOCALES, LOCALE_TO_TITLE } from '@/frontend/utils/locales';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.sidebar.Sidebar', {
  progress: 'Progress',
  language: 'Language',
});

import SoundboardAudioPlayer from '@/frontend/components/game/soundboard/SoundboardAudioPlayer';
import ProgressTabPanel from '@/frontend/components/game/sidebar/progress/ProgressTabPanel';
import OrganizerSpeedDial from '@/frontend/components/game/speed-dial/OrganizerSpeedDial';

import React, { useState } from 'react';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TranslateIcon from '@mui/icons-material/Translate';

import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

export default function Sidebar({}) {
  const myRole = useRoleContext();
  const intl = useIntl();
  const { locale, setLocale } = useLocale();

  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box className="w-full h-full overflow-y-auto">
      {/* Audio player and volume slider */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <SoundboardAudioPlayer />
      </Box>

      {/* Language selector */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TranslateIcon sx={{ fontSize: '0.9rem', color: 'text.secondary', flexShrink: 0 }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
          {intl.formatMessage(messages.language)}
        </Typography>
        <ToggleButtonGroup
          value={locale}
          exclusive
          onChange={(_, val) => val && setLocale(val)}
          size="small"
          sx={{ ml: 'auto' }}
        >
          {LOCALES.map((code) => (
            <ToggleButton key={code} value={code} sx={{ px: 1.5, py: 0.25, fontSize: '0.7rem' }}>
              {LOCALE_TO_TITLE[code]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Sidebar tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="sidebar tabs"
          indicatorColor="primary"
          textColor="inherit"
          variant="fullWidth"
        >
          <Tab
            icon={<FormatListNumberedIcon />}
            label={intl.formatMessage(messages.progress)}
            aria-label="game progress"
            {...a11yProps(0)}
          />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <ProgressTabPanel />
      </CustomTabPanel>

      {myRole === UserRole.ORGANIZER && <OrganizerSpeedDial />}
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
