'use client';

import { useMemo } from 'react';

import { clsx } from 'clsx';

import { selectChoice } from '@/backend/services/question/mcq/actions';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestionOnce } from '@/frontend/hooks/firestore/question/useBaseQuestionHooks';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useTeamId from '@/frontend/hooks/useTeamId';
import useUser from '@/frontend/hooks/useUser';
import { Chooser } from '@/models/chooser';
import { MCQQuestion } from '@/models/questions/mcq';
import { QuestionType } from '@/models/questions/question-type';
import { shuffleIndices } from '@/utils/arrays';

export default function MobileMCQControl() {
  const teamId = useTeamId();
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const { chooser, loading: chooserLoading, error: chooserError } = useChooser(gameId);

  const {
    gameQuestion,
    loading: questionLoading,
    error: questionError,
  } = useQuestion(gameId, roundId, QuestionType.MCQ, questionId);

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = useQuestionOnce(questionId);

  if (questionError || chooserError || baseQuestionError) return null;
  if (questionLoading || chooserLoading || baseQuestionLoading) return <Spinner />;
  if (!gameQuestion || !chooser || !baseQuestion) return null;

  const chooserData = chooser as unknown as Chooser;
  const chooserTeamId = chooserData.chooserOrder[chooserData.chooserIdx] ?? '';
  const isChooser = teamId === chooserTeamId;

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
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const teamId = useTeamId();
  const user = useUser();

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!user) return;
    await selectChoice(gameId, roundId, questionId, user.id as string, teamId as string, idx);
  });

  const choices = baseQuestion.choices ?? [];

  return (
    <ul className="rounded-lg w-4/5 overflow-y-auto space-y-3">
      {randomization.map((origIdx, idx) => (
        <li key={idx} className={clsx(idx !== choices.length - 1 && 'border-b border-border')}>
          <button
            type="button"
            disabled={isSubmitting}
            className="w-full text-left px-4 py-2 border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400 disabled:opacity-100"
            onClick={() => handleSelectChoice(origIdx)}
          >
            <span className="text-lg">
              {MCQQuestion.CHOICES[idx]}. {choices[origIdx]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
