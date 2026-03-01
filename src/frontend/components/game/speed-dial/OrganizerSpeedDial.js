import { resetGame, resumeEditing, returnToGameHome } from '@/backend/services/game/actions';

import SoundboardController from '@/frontend/components/game/soundboard/SoundboardController';

import { useParams, useRouter } from 'next/navigation';

import * as React from 'react';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { styled } from '@mui/material/styles';

import ShareIcon from '@mui/icons-material/Share';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import HomeIcon from '@mui/icons-material/Home';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import EditIcon from '@mui/icons-material/Edit';

const messages = defineMessages('frontend.game.speedDial.OrganizerSpeedDial', {
  share: 'Share',
  soundboard: 'Soundboard',
  home: 'Home',
  resetGame: 'Reset game',
  resumeEditing: 'Resume editing',
});

const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
  position: 'absolute',
  bottom: 16,
  right: 16,
}));

export default function OrganizerSpeedDial() {
  const { id: gameId } = useParams();
  const intl = useIntl();

  const direction = 'up';
  const router = useRouter();

  const actions = [
    { icon: <ShareIcon />, name: 'share', label: intl.formatMessage(messages.share) },
    { icon: <LibraryMusicIcon />, name: 'soundboard', label: intl.formatMessage(messages.soundboard) },
    { icon: <HomeIcon />, name: 'home', label: intl.formatMessage(messages.home) },
    { icon: <RestartAltIcon />, name: 'resetGame', label: intl.formatMessage(messages.resetGame) },
    { icon: <EditIcon />, name: 'resumeEditing', label: intl.formatMessage(messages.resumeEditing) },
  ];

  const [component, setComponent] = React.useState(<></>);
  const [backdropOpen, setBackdropOpen] = React.useState(false);

  const handleBackdropOpen = () => {
    setBackdropOpen(true);
  };

  const handleBackdropClose = () => {
    setBackdropOpen(false);
  };

  const handleClick = async (e, name) => {
    e.preventDefault();
    switch (name) {
      case 'share':
        // updateQuestions()
        break;
      case 'soundboard':
        handleBackdropOpen();
        setComponent(<SoundboardController />);
        break;
      case 'home':
        returnToGameHome(gameId);
        break;
      case 'resetGame':
        resetGame(gameId);
        break;
      case 'resumeEditing':
        resumeEditing(gameId);
        router.push('/edit/' + gameId);
        break;
    }
  };

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={backdropOpen}
        onClick={handleBackdropClose} // => After selecting a sound, the backdrop closes => avoids spamming the participants with sounds
      >
        {component}
      </Backdrop>

      <StyledSpeedDial ariaLabel="SpeedDial of organizer" icon={<SpeedDialIcon />} direction={direction}>
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={<span className="text-xs sm:text-sm 2xl:text-base">{action.label}</span>}
            tooltipPlacement="left"
            tooltipOpen
            onClick={(e) => handleClick(e, action.name)}
          />
        ))}
      </StyledSpeedDial>
    </>
  );
}
