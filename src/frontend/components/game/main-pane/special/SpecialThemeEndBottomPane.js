import { ParticipantRole } from '@/backend/models/users/Participant';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { collection } from 'firebase/firestore';
import { useCollectionDataOnce } from 'react-firebase-hooks/firestore';

import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import GoSpecialHomeButton from '@/frontend/components/game/main-pane/special/GoSpecialHomeButton';
import EndGameButton from '@/frontend/components/game/main-pane/EndGameButton';

export default function SpecialThemeEndBottomPane({}) {
  const myRole = useRole();

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return <SpecialThemeEndOrganizerBottomPane />;
  }
}

function SpecialThemeEndOrganizerBottomPane({}) {
  const game = useGame();

  const [gameThemes, gameThemesLoading, gameThemesError] = useCollectionDataOnce(
    collection(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes')
  );
  if (gameThemesLoading) {
    return <LoadingScreen loadingText="Loading themes..." />;
  }
  if (gameThemesError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameThemesError)}</strong>
      </p>
    );
  }
  if (!gameThemes) {
    return <></>;
  }

  const isLastTheme = gameThemes.every((gameTheme) => gameTheme.order !== null);

  return isLastTheme ? <EndGameButton /> : <GoSpecialHomeButton />;
}
