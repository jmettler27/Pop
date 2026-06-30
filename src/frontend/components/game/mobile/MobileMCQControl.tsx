'use client';

import { useMemo } from 'react';

import { CircularProgress, List, ListItemButton, ListItemText } from '@mui/material';

import BaseQuestionRepositoryFactory from '@/backend/repositories/question/BaseQuestionRepositoryFactory';
import GameMCQQuestionRepository from '@/backend/repositories/question/GameMCQQuestionRepository';
import { selectChoice } from '@/backend/services/question/mcq/actions';
import { shuffleIndices } from '@/backend/utils/arrays';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import { Chooser } from '@/models/chooser';
import { MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';

export default function MobileMCQControl() {
  const myTeam = useTeam();
  const game = useGame();
  const gameRepositories = useGameRepositories();

  if (!game) return null;
  if (!gameRepositories) return null;

  const gameQuestionRepo = new GameMCQQuestionRepository(game.id as string, game.currentRound as string);
  const {
    gameQuestion,
    loading: questionLoading,
    error: questionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  const { chooserRepo } = gameRepositories;
  const { chooser, loading: chooserLoading, error: chooserError } = chooserRepo.useChooser();

  const baseQuestionRepo = BaseQuestionRepositoryFactory.createRepository(QuestionType.MCQ);
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
        <MobileMCQChooserControl chooserTeamId={chooserTeamId} baseQuestion={baseQuestion as unknown as MCQQuestion} />
      ) : (
        <MobileMCQNonChooserControl chooserTeamId={chooserTeamId} />
      )}
    </div>
  );
}

function MobileMCQNonChooserControl({ chooserTeamId }: { chooserTeamId: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center space-y-3">
      <span className="text-xl 2xl:text-4xl font-bold">
        <GameChooserHelperText chooserTeamId={chooserTeamId} />
      </span>
    </div>
  );
}

function MobileMCQChooserControl({
  chooserTeamId,
  baseQuestion,
}: {
  chooserTeamId: string;
  baseQuestion: MCQQuestion;
}) {
  const choices = baseQuestion.choices ?? [];
  const randomMapping = useMemo(() => shuffleIndices(choices.length), [choices.length]);

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-3">
      <>
        <span className="text-xl 2xl:text-4xl font-bold">
          <GameChooserHelperText chooserTeamId={chooserTeamId} />
        </span>
        <MobileMCQChoiceSelector baseQuestion={baseQuestion} randomization={randomMapping} />
      </>
    </div>
  );
}

function MobileMCQChoiceSelector({
  baseQuestion,
  randomization,
}: {
  baseQuestion: MCQQuestion;
  randomization: number[];
}) {
  const game = useGame();
  const myTeam = useTeam();
  const user = useUser();

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

  const choices = baseQuestion.choices ?? [];

  return (
    <List className="rounded-lg w-4/5 overflow-y-auto space-y-3">
      {randomization.map((origIdx, idx) => (
        <ListItemButton
          key={idx}
          divider={idx !== choices.length - 1}
          disabled={isSubmitting}
          sx={{ '&.Mui-disabled': { opacity: 1 } }}
          className="border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400"
          onClick={() => handleSelectChoice(origIdx)}
        >
          <ListItemText
            primary={`${MCQQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
            primaryTypographyProps={{ className: 'text-lg' }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}
