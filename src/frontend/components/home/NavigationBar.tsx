'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import LanguageIcon from '@mui/icons-material/Language';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import ViewListIcon from '@mui/icons-material/ViewList';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { signOut, useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';

import { useLocale } from '@/app/LocaleProvider';
import { LOCALE_TO_EMOJI, LOCALE_TO_TITLE, LOCALES, type Locale } from '@/frontend/helpers/locales';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';

const messages = defineMessages('frontend.home.HomeBar', {
  games: 'Games',
  about: 'About',
  settingsProfile: 'Profile',
  settingsAccount: 'Account',
  settingsDashboard: 'Dashboard',
  settingsLogout: 'Logout',
  selectLanguage: 'Select Language',
});

export function NavigationBar() {
  const { data: session } = useSession();
  const user = session?.user;
  const isGuest = Boolean(user?.isGuest);
  const { locale, setLocale } = useLocale();
  const intl = useIntl();
  const router = useRouter();

  const [anchorElUser, setAnchorElUser] = React.useState<HTMLElement | null>(null);
  const [anchorElLang, setAnchorElLang] = React.useState<HTMLElement | null>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElUser(event.currentTarget);
  const handleOpenLangMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorElLang(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleCloseLangMenu = () => setAnchorElLang(null);

  const allPages = [
    { label: intl.formatMessage(messages.games), icon: <ViewListIcon sx={{ fontSize: '1.1rem' }} />, href: '/' },
    {
      label: intl.formatMessage(globalMessages.createNewGame),
      icon: <AddCircleOutlineIcon sx={{ fontSize: '1.1rem' }} />,
      href: '/edit',
    },
    {
      label: intl.formatMessage(globalMessages.submitQuestion),
      icon: <QuestionAnswerIcon sx={{ fontSize: '1.1rem' }} />,
      href: '/submit',
    },
    { label: intl.formatMessage(messages.about), icon: <InfoIcon sx={{ fontSize: '1.1rem' }} />, href: '/about' },
  ];

  const pages = isGuest ? allPages.slice(0, 1) : allPages;

  const settingsList = [
    { label: intl.formatMessage(messages.settingsProfile), action: () => {} },
    { label: intl.formatMessage(messages.settingsAccount), action: () => {} },
    { label: intl.formatMessage(messages.settingsDashboard), action: () => {} },
    { label: intl.formatMessage(messages.settingsLogout), action: () => signOut() },
  ];

  const handleSelectPage = (href: string) => router.push(href);

  const handleSelectLanguage = (langCode: Locale) => {
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
            {pages.map((page) => (
              <Button
                key={page.href}
                onClick={() => handleSelectPage(page.href)}
                startIcon={page.icon}
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
                {page.label}
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
          {!isGuest && (
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.name ?? ''} src={user?.image ?? ''} sx={{ width: 36, height: 36 }} />
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
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default NavigationBar;
