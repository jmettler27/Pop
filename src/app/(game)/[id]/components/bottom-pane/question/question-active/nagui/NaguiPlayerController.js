import { useUserContext } from '@/app/contexts'
import { useGameContext, useTeamContext } from '@/app/(game)/contexts'

import { Button, ButtonGroup, CircularProgress } from '@mui/material'

import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement';
import NaguiPlayerOptionHelperText from '@/app/(game)/[id]/components/bottom-pane/question/question-active/nagui/NaguiPlayerOptionHelperText';
import { selectNaguiOption } from '@/app/(game)/lib/question/nagui'
import { NAGUI_OPTION_TO_ICON, naguiOptionToTitle } from '@/lib/utils/question/nagui'
import { useAsyncAction } from '@/lib/utils/async';

export default function NaguiPlayerController({ chooserTeamId, realtime }) {

    const myTeam = useTeamContext()
    const isChooser = myTeam === chooserTeamId

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-3'>
            {realtime.option !== null && <span className='2xl:text-4xl font-bold'><NaguiPlayerOptionHelperText realtime={realtime} /></span>}
            {realtime.option === null && (
                <>
                    <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={chooserTeamId} /></span>
                    {isChooser && <NaguiChooserController />}
                </>
            )}
        </div>
    )
}

function NaguiChooserController() {
    const game = useGameContext()
    const user = useUserContext()

    const [handleSelectOption, isSelecting] = useAsyncAction(async (optionIdx) => {
        await selectNaguiOption(game.id, game.currentRound, game.currentQuestion, user.id, optionIdx)
    })

    return (
        <ButtonGroup
            disableElevation
            variant='contained'
            size='large'
        >
            {/* Hide */}
            <Button
                color='success'
                startIcon={NAGUI_OPTION_TO_ICON['hide']}
                onClick={() => handleSelectOption(0)}
                disabled={isSelecting}
            >
                {naguiOptionToTitle('hide')}
            </Button>

            {/* Square */}
            <Button
                color='warning'
                startIcon={NAGUI_OPTION_TO_ICON['square']}
                onClick={() => handleSelectOption(1)}
                disabled={isSelecting}
            >
                {naguiOptionToTitle('square')}
            </Button>

            {/* Duo */}
            <Button
                color='error'
                startIcon={NAGUI_OPTION_TO_ICON['duo']}
                onClick={() => handleSelectOption(2)}
                disabled={isSelecting}
            >
                {naguiOptionToTitle('duo')}
            </Button>
        </ButtonGroup>
    )
}