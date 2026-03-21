import useGame from '@/frontend/hooks/useGame';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentData, useDocumentOnce } from 'react-firebase-hooks/firestore';

import SpecialThemeActiveMiddlePane from '@/frontend/components/game/main-pane/special/theme/SpecialThemeActiveMiddlePane';
import SpecialThemeEndMiddlePane from '@/frontend/components/game/main-pane/special/theme/SpecialThemeEndMiddlePane';
import LoadingScreen from '@/frontend/components/LoadingScreen';

import { SpecialRoundStatus } from '@/backend/models/rounds/Special';
import ErrorScreen from '@/frontend/components/ErrorScreen';

export default function SpecialThemeMiddlePane({ round }) {
  const game = useGame();
  const themeId = round.currentTheme;

  const themeRef = doc(QUESTIONS_COLLECTION_REF, themeId);
  const gameThemeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', themeId);

  const [themeDoc, themeLoading, themeError] = useDocumentOnce(themeRef);
  const [gameTheme, gameThemeLoading, gameThemeError] = useDocumentData(gameThemeRef);
  if (themeError || gameThemeError) {
    return <ErrorScreen inline />;
  }
  if (themeLoading || gameThemeLoading) {
    return <LoadingScreen inline />;
  }
  if (!themeDoc || !gameTheme) {
    return <></>;
  }
  const theme = { id: themeDoc.id, ...themeDoc.data() };

  switch (round.status) {
    case SpecialRoundStatus.THEME_ACTIVE:
      return <SpecialThemeActiveMiddlePane theme={theme} gameTheme={gameTheme} />;
    case SpecialRoundStatus.THEME_END:
      return <SpecialThemeEndMiddlePane theme={theme} gameTheme={gameTheme} />;
  }
}
