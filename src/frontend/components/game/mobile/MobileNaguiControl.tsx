'use client';

import { useMemo } from 'react';

import { clsx } from 'clsx';
import { useIntl } from 'react-intl';

import { selectChoice } from '@/backend/services/question/nagui/actions';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import { NaguiChooserController } from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerController';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import { Spinner } from '@/frontend/components/ui/spinner';
import { useQuestion } from '@/frontend/hooks/firestore/question/useGameQuestionHooks';
import { useChooser } from '@/frontend/hooks/firestore/user/useChooserHooks';
import useActiveQuestion from '@/frontend/hooks/useActiveQuestion';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import { usePlayableQuestion } from '@/frontend/hooks/usePlayableQuestion';
import useTeamId from '@/frontend/hooks/useTeamId';
import useUser from '@/frontend/hooks/useUser';
import globalMessages from '@/frontend/i18n/globalMessages';
import { Chooser } from '@/models/chooser';
import { DuoNaguiOption, GameNaguiQuestion, HideNaguiOption, NaguiQuestion } from '@/models/questions/nagui';
import { QuestionType } from '@/models/questions/question-type';
import { shuffleIndices } from '@/utils/arrays';

export default function MobileNaguiControl() {
  const teamId = useTeamId();
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const { chooser, loading: chooserLoading, error: chooserError } = useChooser(gameId);

  const {
    gameQuestion,
    loading: questionLoading,
    error: questionError,
  } = useQuestion(gameId, roundId, QuestionType.NAGUI, questionId);

  const { baseQuestion, baseQuestionLoading, baseQuestionError } = usePlayableQuestion(
    roundId,
    QuestionType.NAGUI,
    questionId
  );

  if (questionError || chooserError || baseQuestionError) return null;
  if (questionLoading || chooserLoading || baseQuestionLoading) return <Spinner />;
  if (!gameQuestion || !chooser || !baseQuestion) return null;

  const chooserData = chooser as unknown as Chooser;
  const chooserTeamId = chooserData.chooserOrder[chooserData.chooserIdx] ?? '';
  const isChooser = teamId === chooserTeamId;

  return (
    <div className="flex flex-col h-full">
      {isChooser ? (
        <MobileNaguiChooserControl
          chooserTeamId={chooserTeamId}
          gameQuestion={gameQuestion as unknown as GameNaguiQuestion}
          baseQuestion={baseQuestion as unknown as NaguiQuestion}
        />
      ) : (
        <MobileNaguiNonChooserControl
          chooserTeamId={chooserTeamId}
          gameQuestion={gameQuestion as unknown as GameNaguiQuestion}
        />
      )}
    </div>
  );
}

function MobileNaguiNonChooserControl({
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

function MobileNaguiChooserControl({
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
  const { gameId, roundId, questionId } = useActiveQuestion()!;
  const teamId = useTeamId();
  const user = useUser();
  const intl = useIntl();

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!user) return;
    await selectChoice(gameId, roundId, questionId, user.id as string, teamId as string, idx);
  });

  if (gameQuestion.option === HideNaguiOption.TYPE) {
    return <span className="text-2xl">{intl.formatMessage(globalMessages.firstBuzzer)} 🧐</span>;
  }

  const choices = baseQuestion.choices ?? [];
  const duoIndices = baseQuestion.duoIndices ?? [];

  return (
    <ul className="rounded-lg w-4/5 overflow-y-auto space-y-3">
      {randomization.map(
        (origIdx, idx) =>
          (gameQuestion.option !== DuoNaguiOption.TYPE || duoIndices.includes(origIdx)) && (
            <li key={idx} className={clsx(idx !== choices.length - 1 && 'border-b border-border')}>
              <button
                type="button"
                disabled={isSubmitting}
                className="w-full text-left px-4 py-2 border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400 disabled:opacity-100"
                onClick={() => handleSelectChoice(origIdx)}
              >
                <span className="text-lg">
                  {NaguiQuestion.CHOICES[idx]}. {choices[origIdx]}
                </span>
              </button>
            </li>
          )
      )}
    </ul>
  );
}
