'use client';

import { useMemo } from 'react';

import { CircularProgress, List, ListItemButton, ListItemText } from '@mui/material';
import { useIntl } from 'react-intl';

import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import GameNaguiQuestionRepository from '@/backend/repositories/question/GameNaguiQuestionRepository';
import { selectChoice } from '@/backend/services/question/nagui/actions';
import { shuffleIndices } from '@/backend/utils/arrays';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import { NaguiChooserController } from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerController';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import { Chooser } from '@/models/chooser';
import {
  DuoNaguiOption,
  GameNaguiQuestion,
  HideNaguiOption,
  NaguiQuestion,
  SquareNaguiOption,
} from '@/models/questions/nagui';
import { QuestionType } from '@/models/questions/question-type';

import NaguiPlayerOptionHelperText from './NaguiPlayerOptionHelperText';

export default function MobileNaguiControl() {
  const myTeam = useTeam();

  const game = useGame();
  if (!game) return null;

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;

  const gameQuestionRepo = new GameNaguiQuestionRepository(game.id as string, game.currentRound as string);
  const {
    gameQuestion,
    loading: questionLoading,
    error: questionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  const { chooserRepo } = gameRepositories;
  const { chooser, loading: chooserLoading, error: chooserError } = chooserRepo.useChooser();

  const baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(QuestionType.NAGUI);
  const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(
    game.currentQuestion as string
  );

  if (questionError || chooserError || baseQuestionError) return null;
  if (questionLoading || chooserLoading || baseQuestionLoading) return <CircularProgress />;
  if (!gameQuestion || !chooser || !baseQuestion) return null;

  const chooserData = chooser as unknown as Chooser;
  const chooserTeamId = chooserData.chooserOrder[chooserData.chooserIdx] ?? '';
  const isChooser = myTeam === chooserTeamId;

  return (
    <div className="flex flex-col h-full">
      {isChooser ? (
        <MobileNaguiChooserController
          chooserTeamId={chooserTeamId}
          gameQuestion={gameQuestion as unknown as GameNaguiQuestion}
          baseQuestion={baseQuestion as unknown as NaguiQuestion}
        />
      ) : (
        <MobileNaguiNonChooserController
          chooserTeamId={chooserTeamId}
          gameQuestion={gameQuestion as unknown as GameNaguiQuestion}
        />
      )}
    </div>
  );
}

function MobileNaguiNonChooserController({
  chooserTeamId,
  gameQuestion,
}: {
  chooserTeamId: string;
  gameQuestion: GameNaguiQuestion;
}) {
  return (
    <div className="flex flex-col h-full items-center justify-center space-y-3">
      {gameQuestion.option === null && (
        <span className="text-xl 2xl:text-4xl font-bold">
          <GameChooserHelperText chooserTeamId={chooserTeamId} />
        </span>
      )}
      {gameQuestion.option !== null && (
        <span className="text-xl 2xl:text-4xl font-bold">
          <NaguiPlayerOptionHelperText gameQuestion={gameQuestion} />
        </span>
      )}
    </div>
  );
}

function MobileNaguiChooserController({
  chooserTeamId,
  gameQuestion,
  baseQuestion,
}: {
  chooserTeamId: string;
  gameQuestion: GameNaguiQuestion;
  baseQuestion: NaguiQuestion;
}) {
  const choices = baseQuestion.choices ?? [];
  const randomMapping = useMemo(() => shuffleIndices(choices.length), [choices.length]);

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-3">
      {gameQuestion.option === null && (
        <>
          <span className="text-xl 2xl:text-4xl font-bold">
            <GameChooserHelperText chooserTeamId={chooserTeamId} />
          </span>
          <NaguiChooserController />
        </>
      )}
      {gameQuestion.option !== null && (
        <MobileNaguiChoiceSelector
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestion}
          randomization={randomMapping}
        />
      )}
    </div>
  );
}

function MobileNaguiChoiceSelector({
  baseQuestion,
  gameQuestion,
  randomization,
}: {
  baseQuestion: NaguiQuestion;
  gameQuestion: GameNaguiQuestion;
  randomization: number[];
}) {
  const game = useGame();
  const myTeam = useTeam();
  const user = useUser();
  const intl = useIntl();

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!user || !game) return;
    await selectChoice(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id as string,
      myTeam as string,
      idx
    );
  });

  if (!game) return null;

  if (gameQuestion.option === HideNaguiOption.TYPE) {
    return <span className="text-2xl">{intl.formatMessage(globalMessages.firstBuzzer)} 🧐</span>;
  }

  const choices = baseQuestion.choices ?? [];
  const answerIdx = baseQuestion.answerIdx;
  const duoIdx = baseQuestion.duoIdx;

  return (
    <List className="rounded-lg w-4/5 overflow-y-auto space-y-3">
      {randomization.map(
        (origIdx, idx) =>
          (gameQuestion.option !== DuoNaguiOption.TYPE || origIdx === answerIdx || origIdx === duoIdx) && (
            <ListItemButton
              key={idx}
              divider={idx !== choices.length - 1}
              disabled={isSubmitting}
              sx={{ '&.Mui-disabled': { opacity: 1 } }}
              className="border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400"
              onClick={() => handleSelectChoice(origIdx)}
            >
              <ListItemText
                primary={`${NaguiQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
                primaryTypographyProps={{ className: 'text-lg' }}
              />
            </ListItemButton>
          )
      )}
    </List>
  );
}
