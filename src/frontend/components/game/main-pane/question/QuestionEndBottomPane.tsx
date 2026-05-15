import FastForwardIcon from '@mui/icons-material/FastForward';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import { Button } from '@mui/material';
import { useIntl } from 'react-intl';

import { handleQuestionEnd } from '@/backend/services/round/actions';
import ReadyPlayerController from '@/frontend/components/game/main-pane/ReadyPlayerController';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
import { GameRounds } from '@/models/games/game';
import { Round } from '@/models/rounds/round';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.QuestionEndBottomPane', {
  endRound: 'End the round',
  nextQuestion: 'Switch directly to the next question',
});

export default function QuestionEndBottomPane() {
  const game = useGame();
  const gameRepositories = useGameRepositories();

  if (!game || !gameRepositories) return null;

  const { roundRepo } = gameRepositories;
  const { round, loading: roundLoading, error: roundError } = roundRepo.useRoundOnce(game.currentRound as string);

  if (roundError) {
    return <></>;
  }
  if (roundLoading) {
    return <></>;
  }
  if (!round) {
    return <></>;
  }

  const isLastQuestion = round.currentQuestionIdx === round.questions.length - 1;

  return <QuestionEndController round={round} isLastQuestion={isLastQuestion} />;
}

interface QuestionEndControllerProps {
  round: Round;
  isLastQuestion: boolean;
}

function QuestionEndController({ round, isLastQuestion }: QuestionEndControllerProps) {
  const myRole = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController isLastQuestion={isLastQuestion} />
      {myRole === ParticipantRole.ORGANIZER && (
        <QuestionEndOrganizerButton round={round} isLastQuestion={isLastQuestion} />
      )}
    </div>
  );
}

interface QuestionEndOrganizerButtonProps {
  round: Round;
  isLastQuestion: boolean;
}

function QuestionEndOrganizerButton({ round, isLastQuestion }: QuestionEndOrganizerButtonProps) {
  const intl = useIntl();
  const game = useGame();

  const [handleContinueClick, isEnding] = useAsyncAction(async () => {
    if (!game) return;
    await handleQuestionEnd(
      round.type as string,
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string
    );
  });

  return (
    <Button
      className="rounded-full"
      color="secondary"
      size="large"
      variant="contained"
      onClick={handleContinueClick}
      disabled={isEnding}
      startIcon={isLastQuestion ? <ScoreboardIcon /> : <FastForwardIcon />}
    >
      {isLastQuestion ? intl.formatMessage(messages.endRound) : intl.formatMessage(messages.nextQuestion)}
    </Button>
  );
}
