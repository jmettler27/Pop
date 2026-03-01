import { ParticipantRole } from '@/backend/models/users/Participant';

import { handleQuestionEnd } from '@/backend/services/round/actions';

import { useGameContext, useGameRepositoriesContext, useRoleContext } from '@/frontend/contexts';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { Button } from '@mui/material';
import FastForwardIcon from '@mui/icons-material/FastForward';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import ReadyPlayerController from '@/frontend/components/game/bottom-pane/ReadyPlayerController';

const messages = defineMessages('frontend.game.bottom.QuestionEndBottomPane', {
  endRound: 'End the round',
  nextQuestion: 'Switch directly to the next question',
});

export default function QuestionEndBottomPane({}) {
  const game = useGameContext();

  const { roundRepo } = useGameRepositoriesContext();
  const { round, roundLoading, roundError } = roundRepo.useRoundOnce(game.currentRound);

  if (roundError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundError)}</strong>
      </p>
    );
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

function QuestionEndController({ round, isLastQuestion }) {
  const myRole = useRoleContext();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController isLastQuestion={isLastQuestion} />
      {myRole === ParticipantRole.ORGANIZER && (
        <QuestionEndOrganizerButton round={round} isLastQuestion={isLastQuestion} />
      )}
    </div>
  );
}

function QuestionEndOrganizerButton({ round, isLastQuestion }) {
  const intl = useIntl();
  const game = useGameContext();

  const [handleContinueClick, isEnding] = useAsyncAction(async () => {
    await handleQuestionEnd(round.type, game.id, game.currentRound, game.currentQuestion);
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
