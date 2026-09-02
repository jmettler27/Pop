import { FastForward, Trophy } from 'lucide-react';
import { useIntl } from 'react-intl';

import { ROUND_ACTIONS, updateRound } from '@/api';
import ReadyPlayerController from '@/components/game/main-pane/ReadyPlayerController';
import { Button } from '@/components/ui/button';
import { useRoundOnce } from '@/hooks/firestore/round/useRoundHooks';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import useRole from '@/hooks/useRole';
import defineMessages from '@/i18n/defineMessages';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.bottom.QuestionEndBottomPane', {
  endRound: 'End the round',
  nextQuestion: 'Switch directly to the next question',
});

export default function QuestionEndBottomPane() {
  const { gameId, roundId } = useActiveQuestion()!;
  const { round, loading: roundLoading, error: roundError } = useRoundOnce(gameId, roundId);

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

  return <QuestionEndController isLastQuestion={isLastQuestion} />;
}

interface QuestionEndControllerProps {
  isLastQuestion: boolean;
}

function QuestionEndController({ isLastQuestion }: QuestionEndControllerProps) {
  const role = useRole();

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-5">
      <ReadyPlayerController isLastQuestion={isLastQuestion} />
      {role === ParticipantRole.ORGANIZER && <QuestionEndOrganizerButton isLastQuestion={isLastQuestion} />}
    </div>
  );
}

interface QuestionEndOrganizerButtonProps {
  isLastQuestion: boolean;
}

function QuestionEndOrganizerButton({ isLastQuestion }: QuestionEndOrganizerButtonProps) {
  const intl = useIntl();
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleContinueClick, isEnding] = useAsyncAction(async () => {
    await updateRound(gameId, roundId, { action: ROUND_ACTIONS.EndQuestion, questionId });
  });

  return (
    <Button className="rounded-full" variant="secondary" size="lg" onClick={handleContinueClick} disabled={isEnding}>
      {isLastQuestion ? <Trophy className="mr-2 size-4" /> : <FastForward className="mr-2 size-4" />}
      {isLastQuestion ? intl.formatMessage(messages.endRound) : intl.formatMessage(messages.nextQuestion)}
    </Button>
  );
}
