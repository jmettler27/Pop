import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button, ButtonGroup } from '@mui/material';
import { useIntl } from 'react-intl';

import GameProgressiveCluesQuestionRepository from '@/backend/repositories/question/GameProgressiveCluesQuestionRepository';
import { handleBuzzerHeadChanged, invalidateAnswer, validateAnswer } from '@/backend/services/question/buzzer/actions';
import { revealClue } from '@/backend/services/question/progressive-clues/actions';
import BuzzerHeadPlayer from '@/frontend/components/game/main-pane/question/buzzer/BuzzerHeadPlayer';
import ClearBuzzerButton from '@/frontend/components/game/main-pane/question/buzzer/ClearBuzzerButton';
import EndQuestionButton from '@/frontend/components/game/main-pane/question/EndQuestionButton';
import ResetQuestionButton from '@/frontend/components/game/main-pane/question/ResetQuestionButton';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameRounds } from '@/models/games/game';
import { BuzzerQuestion } from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';

const messages = defineMessages('frontend.game.bottom.BuzzerOrganizerController', {
  nextClue: 'Next clue',
});

interface BuzzerOrganizerControllerProps {
  baseQuestion: BuzzerQuestion;
  questionPlayers: Record<string, unknown>;
}

export default function BuzzerOrganizerController({ baseQuestion, questionPlayers }: BuzzerOrganizerControllerProps) {
  const { id } = useParams();
  const gameId = id as string;
  const game = useGame();
  const bq = baseQuestion as { type?: QuestionType };

  const { buzzed } = questionPlayers as { buzzed: string[] };
  const buzzerHead = useRef<string | null>(null);
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  useEffect(() => {
    if (!buzzed || buzzed.length === 0) {
      buzzerHead.current = null;
      return;
    }
    if (buzzerHead.current !== buzzed[0]) {
      buzzerHead.current = buzzed[0];
      handleBuzzerHeadChanged(
        bq.type as QuestionType,
        gameId as string,
        currentRound as string,
        game!.currentQuestion as string,
        buzzerHead.current as string
      );
    }
  }, [buzzed]);

  return (
    <div className="flex flex-col h-full w-full items-center justify-around">
      <BuzzerHeadPlayer buzzed={buzzed} />
      <BuzzerOrganizerAnswerController buzzed={buzzed} questionType={bq.type as QuestionType} />
      <BuzzerOrganizerQuestionController baseQuestion={baseQuestion} />
    </div>
  );
}

interface BuzzerOrganizerAnswerControllerProps {
  buzzed: string[];
  questionType: QuestionType;
}

function BuzzerOrganizerAnswerController({
  buzzed,
  questionType: _questionType,
}: BuzzerOrganizerAnswerControllerProps) {
  const intl = useIntl();
  const game = useGame();
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const buzzedIsEmpty = buzzed.length === 0;

  const [handleValidate, isValidating] = useAsyncAction(async () => {
    await validateAnswer(
      game!.currentQuestionType as QuestionType,
      game!.id as string,
      currentRound as string,
      game!.currentQuestion as string,
      buzzed[0]
    );
  });

  const [handleInvalidate, isInvalidating] = useAsyncAction(async () => {
    await invalidateAnswer(
      game!.currentQuestionType as QuestionType,
      game!.id as string,
      currentRound as string,
      game!.currentQuestion as string,
      buzzed[0]
    );
  });

  return (
    <>
      <ButtonGroup disableElevation variant="contained" size="large" color="primary" disabled={buzzedIsEmpty}>
        <Button color="success" startIcon={<CheckCircleIcon />} onClick={handleValidate} disabled={isValidating}>
          {intl.formatMessage(globalMessages.validate)}
        </Button>
        <Button color="error" startIcon={<CancelIcon />} onClick={handleInvalidate} disabled={isInvalidating}>
          {intl.formatMessage(globalMessages.invalidate)}
        </Button>
      </ButtonGroup>
    </>
  );
}

interface BuzzerOrganizerQuestionControllerProps {
  baseQuestion: BuzzerQuestion;
}

function BuzzerOrganizerQuestionController({ baseQuestion }: BuzzerOrganizerQuestionControllerProps) {
  const bq = baseQuestion as { type?: QuestionType; clues?: unknown[] };
  return (
    <div className="flex flex-row w-full justify-end">
      {bq.type === QuestionType.PROGRESSIVE_CLUES && <NextClueButton baseQuestion={baseQuestion} />}
      <ResetQuestionButton questionType={bq.type as QuestionType} />
      <EndQuestionButton questionType={bq.type as QuestionType} />
      <ClearBuzzerButton questionType={bq.type as QuestionType} />
    </div>
  );
}

function NextClueButton({ baseQuestion }: BuzzerOrganizerQuestionControllerProps) {
  const intl = useIntl();
  const game = useGame();
  const bq = baseQuestion as { clues?: unknown[] };
  const currentRound = game instanceof GameRounds ? game.currentRound : undefined;

  const [handleClick, isLoadingNextClue] = useAsyncAction(async () => {
    await revealClue(game!.id, currentRound, game!.currentQuestion);
  });

  const gameQuestionRepo = new GameProgressiveCluesQuestionRepository(game!.id as string, currentRound as string);
  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game!.currentQuestion as string);

  if (gameQuestionError || gameQuestionLoading || !gameQuestion) {
    return <></>;
  }

  const gq = gameQuestion as { currentClueIdx?: number };
  const isLastClue = (gq.currentClueIdx ?? 0) >= (bq.clues?.length ?? 0) - 1;

  return (
    <Button
      variant="contained"
      size="large"
      onClick={handleClick}
      disabled={isLastClue || isLoadingNextClue}
      startIcon={<ArrowDownwardIcon />}
    >
      {intl.formatMessage(messages.nextClue)}
    </Button>
  );
}
