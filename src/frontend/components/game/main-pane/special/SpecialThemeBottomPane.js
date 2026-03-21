import { doc } from 'firebase/firestore';
import { useDocument, useDocumentOnce } from 'react-firebase-hooks/firestore';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { SpecialRoundStatus } from '@/backend/models/rounds/Special';
import SpecialThemeActiveBottomPane from '@/frontend/components/game/main-pane/special/SpecialThemeActiveBottomPane';
import SpecialThemeEndBottomPane from '@/frontend/components/game/main-pane/special/SpecialThemeEndBottomPane';
import useGame from '@/frontend/hooks/useGame';

export default function SpecialThemeBottomPane({ round }) {
  const game = useGame();

  const currentThemeId = round.currentTheme;
  const baseThemeRef = doc(QUESTIONS_COLLECTION_REF, currentThemeId);
  const gameThemeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes', currentThemeId);

  const [baseThemeDoc, baseThemeLoading, baseThemeError] = useDocumentOnce(baseThemeRef);
  const [gameThemeDoc, gameThemeLoading, gameThemeError] = useDocument(gameThemeRef);
  if (baseThemeError || gameThemeError) {
    return <></>;
  }
  if (baseThemeLoading || gameThemeLoading) {
    return <></>;
  }
  if (!baseThemeDoc || !gameThemeDoc) {
    return <></>;
  }

  const baseTheme = { id: baseThemeDoc.id, ...baseThemeDoc.data() };
  const gameTheme = { id: gameThemeDoc.id, ...gameThemeDoc.data() };

  switch (round.status) {
    case SpecialRoundStatus.THEME_ACTIVE:
      return <SpecialThemeActiveBottomPane baseTheme={baseTheme} gameTheme={gameTheme} />;
    case SpecialRoundStatus.THEME_END:
      return <SpecialThemeEndBottomPane />;
  }
}
