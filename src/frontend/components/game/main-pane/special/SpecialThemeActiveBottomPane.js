import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, ButtonGroup } from '@mui/material';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useIntl } from 'react-intl';

import { GAMES_COLLECTION_REF } from '@/backend/firebase/firestore';
import { ParticipantRole } from '@/backend/models/users/Participant';
import { handleQuestionEndOrganizerContinue } from '@/backend/services/round/special/actions';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/i18n/globalMessages';

export default function SpecialThemeActiveBottomPane({ theme, gameTheme }) {
  const myRole = useRole();

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
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
  const game = useGame();

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
  if (sectionError || sectionLoading || !gameSectionDoc) {
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

function SpecialQuestionActiveOrganizerBottomPane({ gameTheme }) {
  const intl = useIntl();
  const game = useGame();
  const user = useUser();

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
        {intl.formatMessage(globalMessages.validate)}
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
        {intl.formatMessage(globalMessages.invalidate)}
      </Button>
    </ButtonGroup>
  );
}

function SpecialQuestionEndOrganizerBottomPane({ theme, gameTheme, gameSection }) {
  const game = useGame();
  const user = useUser();

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
