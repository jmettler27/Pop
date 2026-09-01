'use client';

import { Columns2, EyeOff, Grid2x2 } from 'lucide-react';

import { QUESTION_ACTIONS, questionAction } from '@/api';
import { GameChooserHelperText } from '@/components/game/chooser/GameChooserTeamAnnouncement';
import NaguiPlayerOptionHelperText from '@/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import { Button } from '@/components/ui/button';
import useActiveQuestion from '@/hooks/useActiveQuestion';
import useAsyncAction from '@/hooks/useAsyncAction';
import useTeamId from '@/hooks/useTeamId';
import { DuoNaguiOption, GameNaguiQuestion, HideNaguiOption, SquareNaguiOption } from '@/models/questions/nagui';

const NAGUI_OPTION_TO_ICON: Record<string, React.ReactElement> = {
  hide: <EyeOff className="mr-2 size-4" />,
  square: <Grid2x2 className="mr-2 size-4" />,
  duo: <Columns2 className="mr-2 size-4" />,
};

interface NaguiPlayerControllerProps {
  chooserTeamId: string;
  gameQuestion: GameNaguiQuestion;
}

export default function NaguiPlayerController({ chooserTeamId, gameQuestion }: NaguiPlayerControllerProps) {
  const teamId = useTeamId();
  const isChooser = teamId === chooserTeamId;

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-3">
      {gameQuestion.option === null && (
        <>
          <span className="text-xl 2xl:text-4xl font-bold">
            <GameChooserHelperText chooserTeamId={chooserTeamId} />
          </span>
          {isChooser && <NaguiChooserController />}
        </>
      )}
      {gameQuestion.option !== null && (
        <span className="text-xl 2xl:text-4xl font-bold">
          <NaguiPlayerOptionHelperText gameQuestion={gameQuestion} />
        </span>
      )}
    </div>
  );
}

export function NaguiChooserController() {
  const { gameId, roundId, questionId } = useActiveQuestion()!;

  const [handleSelectOption, isSelecting] = useAsyncAction(async (optionIdx: number) => {
    await questionAction(gameId, roundId, questionId, { action: QUESTION_ACTIONS.NaguiSelectOption, optionIdx });
  });

  return (
    <div className="flex gap-1">
      <Button
        className="bg-green-600 text-white hover:bg-green-600/80"
        onClick={() => handleSelectOption(0)}
        disabled={isSelecting}
      >
        {NAGUI_OPTION_TO_ICON[HideNaguiOption.TYPE]}
        {HideNaguiOption.typeToTitle()}
      </Button>
      <Button
        className="bg-amber-500 text-white hover:bg-amber-500/80"
        onClick={() => handleSelectOption(1)}
        disabled={isSelecting}
      >
        {NAGUI_OPTION_TO_ICON[SquareNaguiOption.TYPE]}
        {SquareNaguiOption.typeToTitle()}
      </Button>
      <Button variant="destructive" onClick={() => handleSelectOption(2)} disabled={isSelecting}>
        {NAGUI_OPTION_TO_ICON[DuoNaguiOption.TYPE]}
        {DuoNaguiOption.typeToTitle()}
      </Button>
    </div>
  );
}
