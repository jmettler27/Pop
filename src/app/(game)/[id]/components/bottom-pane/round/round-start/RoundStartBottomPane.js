
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'

import { startRound } from '@/app/(game)/lib/round/round-transitions';
import { useAsyncAction } from '@/lib/utils/async';
import TimerPane from '../../../timer/TimerPane';
import ReadyPlayerController from '@/app/(game)/[id]/components/bottom-pane/ReadyPlayerController';

export default function RoundStartBottomPane({ }) {
    return (
        <div className='flex flex-row h-full items-center justify-center divide-x divide-solid'>

            <div className='flex flex-col h-full w-1/5 items-center justify-center'>
                <TimerPane />
            </div>

            <div className='flex flex-col h-full w-4/5  items-center justify-center'>
                <RoundStartController />
            </div>
        </div>
    )
}


function RoundStartController({ }) {
    const myRole = useRoleContext()

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-5'>
            <ReadyPlayerController />
            {myRole === 'organizer' && <RoundStartOrganizerButton />}
        </div>
    )
}


import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';


function RoundStartOrganizerButton({ lang = 'fr-FR' }) {
    const game = useGameContext()

    const [handleContinueClick, isHandling] = useAsyncAction(async () => {
        await startRound(game.id, game.currentRound)
    })

    return (
        <Button
            className='rounded-full'
            size='large'
            variant='contained'
            color='secondary'
            onClick={handleContinueClick}
            disabled={isHandling}
            startIcon={<ArrowForwardIosIcon />}
        >
            {ROUND_START_ORGANIZER_BUTTON_TEXT[lang]}
        </Button>
    )
}


const ROUND_START_ORGANIZER_BUTTON_TEXT = {
    'en': "Launch the first question",
    'fr-FR': "Lancer la première question"
}
