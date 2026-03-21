import { collection } from 'firebase/firestore';
import { useCollectionDataOnce } from 'react-firebase-hooks/firestore';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { ParticipantRole } from '@/backend/models/users/Participant';
import EndGameButton from '@/frontend/components/game/main-pane/EndGameButton';
import GoSpecialHomeButton from '@/frontend/components/game/main-pane/special/GoSpecialHomeButton';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';

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
  if (gameThemesLoading || gameThemesError || !gameThemes) {
    return <></>;
  }

  const isLastTheme = gameThemes.every((gameTheme) => gameTheme.order !== null);

  return isLastTheme ? <EndGameButton /> : <GoSpecialHomeButton />;
}
