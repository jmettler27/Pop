import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useIntl } from 'react-intl';

import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';
import {
  cancelPlayer,
  handleBuzzerHeadChanged,
  validateAllLabels,
} from '@/backend/services/question/labelling/actions';
import { isEmpty } from '@/backend/utils/arrays';
import BuzzerHeadPlayer from '@/frontend/components/game/main-pane/question/buzzer/BuzzerHeadPlayer';
import ClearBuzzerButton from '@/frontend/components/game/main-pane/question/buzzer/ClearBuzzerButton';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import RevealLabelButton from '@/frontend/components/game/main-pane/question/labelling/RevealLabelButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import { Button } from '@/frontend/components/ui/button';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { QuestionType } from '@/models/questions/question-type';

interface LabellingOrganizerControllerProps {
  baseQuestion: LabellingQuestion;
  questionPlayers: {
    buzzed: string[];
  };
}

export default function LabellingOrganizerController({
  baseQuestion,
  questionPlayers,
}: LabellingOrganizerControllerProps) {
  const { id } = useParams();
  const gameId = id as string;

  const game = useGame();
  const { buzzed } = questionPlayers;
  const buzzerHead = useRef<string | null>(null);

  useEffect(() => {
    if (!game) return;
    if (!buzzed || buzzed.length === 0) {
      buzzerHead.current = null;
      return;
    }
    const buzzerHeadId = buzzed[0]!;
    if (buzzerHead.current !== buzzerHeadId) {
      buzzerHead.current = buzzerHeadId;
      handleBuzzerHeadChanged(
        gameId as string,
        game.currentRound as string,
        game.currentQuestion as string,
        buzzerHeadId
      );
    }
  }, [buzzed, game, gameId]);

  if (!game) return null;

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BuzzerHeadPlayer buzzed={buzzed} />
      <LabelOrganizerAnswerController buzzed={buzzed} baseQuestion={baseQuestion} />
      <LabelOrganizerQuestionController />
    </div>
  );
}

function LabelOrganizerAnswerController({
  buzzed,
  baseQuestion,
}: {
  buzzed: string[];
  baseQuestion: LabellingQuestion;
}) {
  const game = useGame();

  const gameQuestionRepo = new GameLabellingQuestionRepository(game?.id as string, game?.currentRound as string);
  const { gameQuestion, loading, error } = useQuestion(gameQuestionRepo, game?.currentQuestion as string);

  if (!game) return null;

  if (error) {
    return <></>;
  }
  if (loading) {
    return <Spinner />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  return (
    <>
      <div className="flex gap-1">
        <ValidateAllLabelsButton buzzed={buzzed} gameQuestion={gameQuestion as GameLabellingQuestion} />
        <CancelLabelButton buzzed={buzzed} />
        <RevealLabelButton
          buzzed={buzzed}
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestion as GameLabellingQuestion}
        />
      </div>
    </>
  );
}

function ValidateAllLabelsButton({ buzzed, gameQuestion }: { buzzed: string[]; gameQuestion: GameLabellingQuestion }) {
  const intl = useIntl();
  const game = useGame();

  const atLeastOneRevealed = gameQuestion.atLeastOneLabelIsRevealed();
  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleValidateAll, isValidating] = useAsyncAction(async () => {
    if (!game) return;
    await validateAllLabels(game.id as string, game.currentRound as string, game.currentQuestion as string, buzzed[0]);
  });

  return (
    <Button
      className="bg-green-600 text-white hover:bg-green-600/80"
      onClick={handleValidateAll}
      disabled={atLeastOneRevealed || buzzedIsEmpty || isValidating}
    >
      <CheckCircle2 className="mr-2 size-4" />
      {intl.formatMessage(globalMessages.validateAll)}
    </Button>
  );
}

function CancelLabelButton({ buzzed }: { buzzed: string[] }) {
  const intl = useIntl();
  const game = useGame();

  const buzzedIsEmpty = isEmpty(buzzed);

  const [handleCancelLabel, isCanceling] = useAsyncAction(async () => {
    if (!game) return;
    await cancelPlayer(game.id as string, game.currentRound as string, game.currentQuestion as string, buzzed[0]);
  });

  return (
    <>
      <Button variant="destructive" onClick={handleCancelLabel} disabled={buzzedIsEmpty || isCanceling}>
        <XCircle className="mr-2 size-4" />
        {intl.formatMessage(globalMessages.cancel)}
      </Button>
    </>
  );
}

function LabelOrganizerQuestionController() {
  return (
    <div className="flex flex-row w-full justify-end">
      <ResetQuestionButton questionType={QuestionType.LABELLING} />
      <EndQuestionButton questionType={QuestionType.LABELLING} />
      <ClearBuzzerButton questionType={QuestionType.LABELLING} />
    </div>
  );
}
