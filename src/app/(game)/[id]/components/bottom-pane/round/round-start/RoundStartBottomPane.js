
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StartIcon from '@mui/icons-material/Start';
import { startFinaleRound, startRoundFirstQuestion } from '@/app/(game)/lib/round/round-transitions';
import { useAsyncAction } from '@/lib/utils/async';

export default function RoundStartBottomPane({ startedRound }) {
    const myRole = useRoleContext()

    const SelectedRoundStartBottomPane = () => {
        switch (myRole) {
            case 'organizer':
                return <RoundStartBottomPaneOrganizer startedRound={startedRound} />
            case 'player':
                return <RoundStartBottomPanePlayer />
            default:
                return <></>
        }
    }

    return (
        <div className='flex flex-col h-full justify-around items-center'>
            <SelectedRoundStartBottomPane />
        </div>
    )
}

function RoundStartBottomPaneOrganizer({ startedRound }) {
    const game = useGameContext()

    const [handleContinueClick, isHandling] = useAsyncAction(async () => {
        if (startedRound.type !== 'finale')
            await startRoundFirstQuestion(game.id, game.currentRound)
        else
            await startFinaleRound(game.id, game.currentRound)
    })

    return (
        <div className='h-full flex flex-col justify-center items-center'>
            <Button
                variant='contained'
                size='large'
                onClick={handleContinueClick}
                disabled={isHandling}
                endIcon={<StartIcon />}
            >
                Begin Round
            </Button>
        </div>
    )

}


function RoundStartBottomPanePlayer() {


}