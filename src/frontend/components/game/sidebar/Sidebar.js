import React, { useState } from 'react';

import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TranslateIcon from '@mui/icons-material/Translate';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useIntl } from 'react-intl';

import { useLocale } from '@/app/LocaleProvider';
import { ParticipantRole } from '@/backend/models/users/Participant';
import ProgressTabPanel from '@/frontend/components/game/sidebar/progress/ProgressTabPanel';
import SoundboardAudioPlayer from '@/frontend/components/game/soundboard/SoundboardAudioPlayer';
import OrganizerSpeedDial from '@/frontend/components/game/speed-dial/OrganizerSpeedDial';
import { LOCALE_TO_TITLE, LOCALES } from '@/frontend/helpers/locales';
import useRole from '@/frontend/hooks/useRole';
import globalMessages from '@/i18n/globalMessages';
import defineMessages from '@/utils/defineMessages';

const messages = defineMessages('frontend.game.sidebar.Sidebar', {
  progress: 'Progress',
});

export default function Sidebar({}) {
  const myRole = useRole();
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
          {intl.formatMessage(globalMessages.language)}
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

      {myRole === ParticipantRole.ORGANIZER && <OrganizerSpeedDial />}
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
