import Image from 'next/image';

import { Button, CircularProgress, Tooltip } from '@mui/material';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';

import { QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { ParticipantRole } from '@/backend/models/users/Participant';
import { startTheme } from '@/backend/services/round/special/actions';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';

export default function SpecialHomeThemeAvatar({ gameTheme, isChooser }) {
  const game = useGame();
  const myRole = useRole();

  const [handleSelectTheme, isStartingTheme] = useAsyncAction(async (themeId) => {
    await startTheme(game.id, game.currentRound, themeId);
  });

  const themeId = gameTheme.id;
  const themeRef = doc(QUESTIONS_COLLECTION_REF, themeId);
  const [themeDoc, themeDocLoading, themeDocError] = useDocument(themeRef);

  if (themeDocError) {
    return <></>;
  }
  if (themeDocLoading) {
    return <CircularProgress />;
  }
  if (!themeDoc) {
    return <span>Theme not found</span>;
  }
  const theme = { id: themeDoc.id, ...themeDoc.data() };

  const themeHasEnded = gameTheme.dateEnd != null;

  const themeIsDisabled = () => {
    if (themeHasEnded) return true;
    if (myRole === ParticipantRole.ORGANIZER) return false;
    if (myRole === ParticipantRole.PLAYER) return !isChooser;
    return true;
  };

  return (
    <Tooltip title={theme.details.title} placement="top">
      <span>
        <Button
          className="p-3 min-h-[125px] max-h-[125px] min-w-[125px] max-w-[125px]"
          variant="contained"
          color="info"
          sx={{
            borderRadius: '100px',
            boxShadow: 12,
            '&.Mui-disabled': {
              opacity: myRole === 'spectator' && !themeHasEnded ? 1 : 0.5,
              bgcolor: themeHasEnded ? 'grey.500' : 'primary.main',
            },
          }}
          onClick={() => handleSelectTheme(theme.id)}
          disabled={isStartingTheme || themeIsDisabled()}
        >
          <ThemeImage theme={theme} />
        </Button>
      </span>
    </Tooltip>
  );
}

const ThemeImage = ({ theme }) => (
  <Image src={theme.details.image} alt={theme.details.title} width={100} height={100} />
);
