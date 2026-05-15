import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, ButtonGroup, CircularProgress } from '@mui/material';
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
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
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
  if (!game) return null;

  const { buzzed } = questionPlayers;
  const buzzerHead = useRef<string | null>(null);

  useEffect(() => {
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
  }, [buzzed]);

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
  if (!game) return null;

  const gameQuestionRepo = new GameLabellingQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <></>;
  }
  if (loading) {
    return <CircularProgress />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  return (
    <>
      <ButtonGroup disableElevation variant="contained" size="large" color="primary">
        <ValidateAllLabelsButton buzzed={buzzed} gameQuestion={gameQuestion as GameLabellingQuestion} />
        <CancelLabelButton buzzed={buzzed} />
        <RevealLabelButton
          buzzed={buzzed}
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestion as GameLabellingQuestion}
        />
      </ButtonGroup>
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
      color="success"
      startIcon={<CheckCircleIcon />}
      onClick={handleValidateAll}
      disabled={atLeastOneRevealed || buzzedIsEmpty || isValidating}
    >
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
      <Button
        color="error"
        startIcon={<CancelIcon />}
        onClick={handleCancelLabel}
        disabled={buzzedIsEmpty || isCanceling}
      >
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
