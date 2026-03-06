import { selectOption } from '@/backend/services/question/nagui/actions';
import { HideNaguiOption, SquareNaguiOption, DuoNaguiOption } from '@/backend/models/questions/Nagui';

import useGame from '@/frontend/hooks/useGame';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';

import { GameChooserHelperText } from '@/frontend/components/game/chooser/GameChooserTeamAnnouncement';
import NaguiPlayerOptionHelperText from '@/frontend/components/game/main-pane/question/nagui/NaguiPlayerOptionHelperText';

import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Looks4Icon from '@mui/icons-material/Looks4';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';

import { Button, ButtonGroup, CircularProgress } from '@mui/material';

const NAGUI_OPTION_TO_ICON = {
  hide: <VisibilityOffIcon />,
  square: <Looks4Icon />,
  duo: <LooksTwoIcon />,
};

export default function NaguiPlayerController({ chooserTeamId, gameQuestion }) {
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

  const [handleSelectOption, isSelecting] = useAsyncAction(async (optionIdx) => {
    await selectOption(game.id, game.currentRound, game.currentQuestion, user.id, optionIdx);
  });

  return (
    <ButtonGroup disableElevation variant="contained" size="large">
      {/* Hide */}
      <Button
        color="success"
        startIcon={NAGUI_OPTION_TO_ICON[HideNaguiOption.TYPE]}
        onClick={() => handleSelectOption(0)}
        disabled={isSelecting}
      >
        {HideNaguiOption.typeToTitle()}
      </Button>

      {/* Square */}
      <Button
        color="warning"
        startIcon={NAGUI_OPTION_TO_ICON[SquareNaguiOption.TYPE]}
        onClick={() => handleSelectOption(1)}
        disabled={isSelecting}
      >
        {SquareNaguiOption.typeToTitle()}
      </Button>

      {/* Duo */}
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
