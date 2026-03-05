import { startTheme } from '@/backend/services/round/special/actions';

import { ParticipantRole } from '@/backend/models/users/Participant';

import { QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button, Tooltip, CircularProgress, Badge } from '@mui/material';

export default function SpecialHomeThemeAvatar({ gameTheme, isChooser }) {
  const game = useGameContext();
  const myRole = useRoleContext();

  const [handleSelectTheme, isStartingTheme] = useAsyncAction(async (themeId) => {
    await startTheme(game.id, game.currentRound, themeId);
  });

  const themeId = gameTheme.id;
  const themeRef = doc(QUESTIONS_COLLECTION_REF, themeId);
  const [themeDoc, themeDocLoading, themeDocError] = useDocument(themeRef);

  if (themeDocError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(themeDocError)}</strong>
      </p>
    );
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

import Image from 'next/image';
import { topicToEmoji } from '@/backend/models/Topic';

const ThemeImage = ({ theme }) => (
  <Image src={theme.details.image} alt={theme.details.title} width={100} height={100} />
);
