import { handlePlayerAnswer, handleQuestionEndOrganizerContinue } from '@/backend/services/round/special/actions';

import { UserRole } from '@/backend/models/users/User';

import { INVALIDATE_ANSWER, VALIDATE_ANSWER } from '@/backend/utils/question/question';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';

import { useUserContext, useGameContext, useRoleContext } from '@/frontend/contexts';

import { GameChooserHelperText } from '@/frontend/components/game/GameChooserTeamAnnouncement';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { Button, ButtonGroup } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

export default function SpecialThemeActiveBottomPane({ theme, gameTheme }) {
  const myRole = useRoleContext();

  switch (myRole) {
    case UserRole.ORGANIZER:
      return <SpecialThemeActiveOrganizerBottomPane theme={theme} gameTheme={gameTheme} />;
    default:
      return (
        <span className="2xl:text-4xl font-bold">
          <GameChooserHelperText chooserTeamId={gameTheme.teamId} />
        </span>
      );
  }
}

function SpecialThemeActiveOrganizerBottomPane({ theme, gameTheme }) {
  const game = useGameContext();

  const { currentSectionIdx } = gameTheme;
  const currentSectionId = theme.details.sections[currentSectionIdx];

  const gameSectionRef = doc(
    GAMES_COLLECTION_REF,
    game.id,
    'rounds',
    game.currentRound,
    'themes',
    theme.id,
    'sections',
    currentSectionId
  );
  const [gameSectionDoc, sectionLoading, sectionError] = useDocument(gameSectionRef);
  if (sectionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(sectionError)}</strong>
      </p>
    );
  }
  if (sectionLoading) {
    return <></>;
  }
  if (!gameSectionDoc) {
    return <></>;
  }
  const gameSection = { id: gameSectionDoc.id, ...gameSectionDoc.data() };

  switch (gameSection.status) {
    case 'question_active':
      return <SpecialQuestionActiveOrganizerBottomPane gameTheme={gameTheme} />;
    case 'question_end':
      return <SpecialQuestionEndOrganizerBottomPane theme={theme} gameTheme={gameTheme} gameSection={gameSection} />;
  }
}

function SpecialQuestionActiveOrganizerBottomPane({ gameTheme, lang = DEFAULT_LOCALE }) {
  const game = useGameContext();
  const user = useUserContext();

  const [handlePlayerAnswer, isHandling] = useAsyncAction(async (invalidate) => {
    await handlePlayerAnswer(game.id, game.currentRound, gameTheme.id, invalidate, user.id);
  });

  return (
    <ButtonGroup disableElevation variant="contained" size="large" color="primary">
      {/* Validate the player's answer */}
      <Button
        color="success"
        startIcon={<CheckCircleIcon />}
        onClick={() => {
          handlePlayerAnswer(false);
        }}
        disabled={isHandling}
      >
        {VALIDATE_ANSWER[lang]}
      </Button>

      {/* Invalidate the player's answer */}
      <Button
        color="error"
        startIcon={<CancelIcon />}
        onClick={() => {
          handlePlayerAnswer(true);
        }}
        disabled={isHandling}
      >
        {INVALIDATE_ANSWER[lang]}
      </Button>
    </ButtonGroup>
  );
}

function SpecialQuestionEndOrganizerBottomPane({ theme, gameTheme, gameSection }) {
  const game = useGameContext();
  const user = useUserContext();

  const [handleContinue, isHandling] = useAsyncAction(async () => {
    await handleQuestionEndOrganizerContinue(
      game.id,
      game.currentRound,
      theme.id,
      gameSection.id,
      isLastQuestionInSection,
      isLastSectionInTheme,
      user.id
    );
  });

  const isLastQuestionInSection = gameSection.currentQuestionIdx === gameSection.question_status.length - 1;
  const isLastSectionInTheme = gameTheme.currentSectionIdx === theme.details.sections.length - 1;

  const continueButtonText = () => {
    if (!isLastQuestionInSection) return 'Next Question';
    if (!isLastSectionInTheme) return 'Next Section';
    return 'Score Summary';
  };

  return (
    <Button variant="contained" endIcon={<ArrowRightIcon />} onClick={handleContinue} disabled={isHandling}>
      {continueButtonText()}
    </Button>
  );
}
