import { FastForward, Trophy } from 'lucide-react';
import { useIntl } from 'react-intl';

import { updateRound } from '@/frontend/api';
import ReadyPlayerController from '@/frontend/components/game/main-pane/ReadyPlayerController';
import { Button } from '@/frontend/components/ui/button';
import { useRoundOnce } from '@/frontend/hooks/firestore/round/useRoundHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useRole from '@/frontend/hooks/useRole';
import defineMessages from '@/frontend/i18n/defineMessages';
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
    await updateRound(gameId, roundId, { action: 'question_end', questionId });
  });

  return (
    <Button className="rounded-full" variant="secondary" size="lg" onClick={handleContinueClick} disabled={isEnding}>
      {isLastQuestion ? <Trophy className="mr-2 size-4" /> : <FastForward className="mr-2 size-4" />}
      {isLastQuestion ? intl.formatMessage(messages.endRound) : intl.formatMessage(messages.nextQuestion)}
    </Button>
  );
}
