import { UserRole } from '@/backend/models/users/User';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { collection } from 'firebase/firestore';
import { useCollectionDataOnce } from 'react-firebase-hooks/firestore';

import { useGameContext, useRoleContext } from '@/frontend/contexts';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import GoSpecialHomeButton from '@/frontend/components/game/bottom-pane/special/theme/theme-end/GoSpecialHomeButton';
import EndGameButton from '@/frontend/components/game/bottom-pane/EndGameButton';

export default function SpecialThemeEndBottomPane({}) {
  const myRole = useRoleContext();

  switch (myRole) {
    case UserRole.ORGANIZER:
      return <SpecialThemeEndOrganizerBottomPane />;
  }
}

function SpecialThemeEndOrganizerBottomPane({}) {
  const game = useGameContext();

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
