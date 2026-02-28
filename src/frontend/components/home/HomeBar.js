import * as React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
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
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

const pages = {
  en: ['Games', 'Create a new game', 'Submit a question', 'About'],
  'fr-FR': ['Parties', 'Créer une partie', 'Soumettre une question', 'À propos'],
};

const pageIcons = [
  <ViewListIcon key="games" sx={{ fontSize: '1.1rem' }} />,
  <AddCircleOutlineIcon key="create" sx={{ fontSize: '1.1rem' }} />,
  <QuestionAnswerIcon key="submit" sx={{ fontSize: '1.1rem' }} />,
  <InfoIcon key="about" sx={{ fontSize: '1.1rem' }} />,
];

const settings = {
  en: ['Profile', 'Account', 'Dashboard', 'Logout'],
  'fr-FR': ['Profil', 'Compte', 'Tableau de bord', 'Déconnexion'],
};

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
];

export function HomeBar({ lang = DEFAULT_LOCALE, onLanguageChange }) {
  const { data: session } = useSession();
  const { user } = session;

  const router = useRouter();

  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [anchorElLang, setAnchorElLang] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleOpenLangMenu = (event) => {
    setAnchorElLang(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleCloseLangMenu = () => {
    setAnchorElLang(null);
  };

  const handleSelectSetting = (setting) => {
    if (setting === 'Logout' || setting === 'Déconnexion') {
      signOut();
    }
  };

  const handleSelectLanguage = (langCode) => {
    if (onLanguageChange) {
      onLanguageChange(langCode);
    }
    handleCloseLangMenu();
  };

  const handleSelectPage = (idx) => {
    console.log(idx);
    if (idx === 0) {
      router.push('/');
    }
    if (idx === 1) {
      router.push('/edit');
    }
    if (idx === 2) {
      router.push('/submit');
    }
    // if (idx === 3) {
    //     router.push('/about')
    // }
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
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            Pop!
          </Typography>

          {/* <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleOpenNavMenu}
                            color="inherit"
                        >
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorElNav}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            open={Boolean(anchorElNav)}
                            onClose={handleCloseNavMenu}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                            }}
                        >
                            {pages[lang].map((page, idx) => (
                                <MenuItem key={page} onClick={() => handleSelectPage(idx)}>
                                    <Typography textAlign="center">{page}</Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </Box> */}
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
            {pages[lang].map((page, idx) => (
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
            <Tooltip title="Select Language">
              <IconButton onClick={handleOpenLangMenu} sx={{ p: 0.5 }}>
                <LanguageIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="language-menu"
              anchorEl={anchorElLang}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElLang)}
              onClose={handleCloseLangMenu}
            >
              {languages.map((language) => (
                <MenuItem
                  key={language.code}
                  onClick={() => handleSelectLanguage(language.code)}
                  selected={lang === language.code}
                >
                  <Typography textAlign="center">
                    {language.flag} {language.label}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

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
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings[lang].map((setting) => (
                <MenuItem key={setting} onClick={() => handleSelectSetting(setting)}>
                  <Typography textAlign="center">{setting}</Typography>
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
