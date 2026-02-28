import * as React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import InfoIcon from '@mui/icons-material/Info';
import LanguageIcon from '@mui/icons-material/Language';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import { useLocale } from '@/app/LocaleProvider';
import { LOCALES, LOCALE_TO_EMOJI, LOCALE_TO_TITLE } from '@/frontend/utils/locales';

const messages = defineMessages('frontend.home.HomeBar', {
  games: 'Games',
  createGame: 'Create a new game',
  submitQuestion: 'Submit a question',
  about: 'About',
  settingsProfile: 'Profile',
  settingsAccount: 'Account',
  settingsDashboard: 'Dashboard',
  settingsLogout: 'Logout',
  selectLanguage: 'Select Language',
});

const pageIcons = [
  <ViewListIcon key="games" sx={{ fontSize: '1.1rem' }} />,
  <AddCircleOutlineIcon key="create" sx={{ fontSize: '1.1rem' }} />,
  <QuestionAnswerIcon key="submit" sx={{ fontSize: '1.1rem' }} />,
  <InfoIcon key="about" sx={{ fontSize: '1.1rem' }} />,
];

export function HomeBar() {
  const { data: session } = useSession();
  const { user } = session;
  const { locale, setLocale } = useLocale();
  const intl = useIntl();
  const router = useRouter();

  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [anchorElLang, setAnchorElLang] = React.useState(null);

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleOpenLangMenu = (event) => setAnchorElLang(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleCloseLangMenu = () => setAnchorElLang(null);

  const pages = [
    intl.formatMessage(messages.games),
    intl.formatMessage(messages.createGame),
    intl.formatMessage(messages.submitQuestion),
    intl.formatMessage(messages.about),
  ];

  const settingsList = [
    { label: intl.formatMessage(messages.settingsProfile), action: () => {} },
    { label: intl.formatMessage(messages.settingsAccount), action: () => {} },
    { label: intl.formatMessage(messages.settingsDashboard), action: () => {} },
    { label: intl.formatMessage(messages.settingsLogout), action: () => signOut() },
  ];

  const handleSelectPage = (idx) => {
    if (idx === 0) router.push('/');
    if (idx === 1) router.push('/edit');
    if (idx === 2) router.push('/submit');
  };

  const handleSelectLanguage = (langCode) => {
    setLocale(langCode);
    handleCloseLangMenu();
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      }}
      enableColorOnDark
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <SportsEsportsIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, fontSize: '1.5rem' }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 3,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.15rem',
              color: 'inherit',
              textDecoration: 'none',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            Pop!
          </Typography>

          <SportsEsportsIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1, fontSize: '1.5rem' }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.15rem',
              color: 'inherit',
              textDecoration: 'none',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Pop!
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
            {pages.map((page, idx) => (
              <Button
                key={page}
                onClick={() => handleSelectPage(idx)}
                startIcon={pageIcons[idx]}
                sx={{
                  color: 'white',
                  display: 'flex',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {page}
              </Button>
            ))}
          </Box>

          {/* Language Selector */}
          <Box sx={{ flexGrow: 0, mr: 2 }}>
            <Tooltip title={intl.formatMessage(messages.selectLanguage)}>
              <IconButton onClick={handleOpenLangMenu} sx={{ p: 0.5 }}>
                <LanguageIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="language-menu"
              anchorEl={anchorElLang}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElLang)}
              onClose={handleCloseLangMenu}
            >
              {LOCALES.map((code) => (
                <MenuItem key={code} onClick={() => handleSelectLanguage(code)} selected={locale === code}>
                  <Typography textAlign="center">
                    {LOCALE_TO_EMOJI[code]} {LOCALE_TO_TITLE[code]}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* User menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user.name} src={user.image} sx={{ width: 36, height: 36 }} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settingsList.map((setting) => (
                <MenuItem
                  key={setting.label}
                  onClick={() => {
                    setting.action();
                    handleCloseUserMenu();
                  }}
                >
                  <Typography textAlign="center">{setting.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default HomeBar;
