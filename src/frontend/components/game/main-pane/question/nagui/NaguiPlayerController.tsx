'use client';

import Looks4Icon from '@mui/icons-material/Looks4';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Button, ButtonGroup } from '@mui/material';

import { selectOption } from '@/backend/services/question/nagui/actions';
import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import type { GameRounds } from '@/models/games/game';
import { DuoNaguiOption, GameNaguiQuestion, HideNaguiOption, SquareNaguiOption } from '@/models/questions/nagui';

const NAGUI_OPTION_TO_ICON: Record<string, React.ReactElement> = {
  hide: <VisibilityOffIcon />,
  square: <Looks4Icon />,
  duo: <LooksTwoIcon />,
};

interface NaguiPlayerControllerProps {
  chooserTeamId: string;
  gameQuestion: GameNaguiQuestion;
}

export default function NaguiPlayerController({ chooserTeamId, gameQuestion }: NaguiPlayerControllerProps) {
  const myTeam = useTeam();
  const isChooser = myTeam === chooserTeamId;

  return (
    <div className="flex flex-col h-full items-center justify-center space-y-3">
      {gameQuestion.option !== null && (
        <span className="2xl:text-4xl font-bold">
          <NaguiPlayerOptionHelperText gameQuestion={gameQuestion} />
        </span>
      )}
      {gameQuestion.option === null && (
        <>
          <span className="2xl:text-4xl font-bold">
            <GameChooserHelperText chooserTeamId={chooserTeamId} />
          </span>
          {isChooser && <NaguiChooserController />}
        </>
      )}
    </div>
  );
}

function NaguiChooserController() {
  const game = useGame();
  const user = useUser();

  const [handleSelectOption, isSelecting] = useAsyncAction(async (optionIdx: number) => {
    if (!game || !user) return;
    await selectOption(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id,
      String(optionIdx)
    );
  });

  return (
    <ButtonGroup disableElevation variant="contained" size="large">
      <Button
        color="success"
        startIcon={NAGUI_OPTION_TO_ICON[HideNaguiOption.TYPE]}
        onClick={() => handleSelectOption(0)}
        disabled={isSelecting}
      >
        {HideNaguiOption.typeToTitle()}
      </Button>
      <Button
        color="warning"
        startIcon={NAGUI_OPTION_TO_ICON[SquareNaguiOption.TYPE]}
        onClick={() => handleSelectOption(1)}
        disabled={isSelecting}
      >
        {SquareNaguiOption.typeToTitle()}
      </Button>
      <Button
        color="error"
        startIcon={NAGUI_OPTION_TO_ICON[DuoNaguiOption.TYPE]}
        onClick={() => handleSelectOption(2)}
        disabled={isSelecting}
      >
        {DuoNaguiOption.typeToTitle()}
      </Button>
    </ButtonGroup>
  );
}
