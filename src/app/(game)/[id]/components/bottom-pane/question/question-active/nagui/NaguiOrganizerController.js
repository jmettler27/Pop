import { useGameContext } from '@/app/(game)/contexts'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'

import { handleNaguiHideAnswer } from '@/app/(game)/lib/question/nagui'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement'
import NaguiPlayerOptionHelperText from './NaguiPlayerOptionHelperText'
import { useAsyncAction } from '@/lib/utils/async'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'
import { INVALIDATE_ANSWER, VALIDATE_ANSWER } from '@/lib/utils/question/question'


export default function NaguiOrganizerController({ realtime }) {
    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            {/* <BuzzerHeadPlayer realtime={realtime} />
            */}
            {realtime.option === null && (
                <span className='2xl:text-4xl font-bold'><GameChooserHelperText chooserTeamId={realtime.teamId} /></span>
            )}
            {realtime.option !== null && (
                <span className='2xl:text-4xl'><NaguiPlayerOptionHelperText realtime={realtime} /></span>
            )}
            {realtime.option === 'hide' && <NaguiOrganizerHideAnswerController realtime={realtime} />}
            <div className='flex flex-row w-full justify-end'>
                <ResetQuestionButton />
                <EndQuestionButton />
            </div>
        </div>
    )
}


function NaguiOrganizerHideAnswerController({ realtime, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleClick, isHandling] = useAsyncAction(async (correct) => {
        await handleNaguiHideAnswer(game.id, game.currentRound, game.currentQuestion, realtime.playerId, realtime.teamId, correct)
    })

    {/* Validate or invalidate the player's answer */ }
    return <>
        <ButtonGroup
            disableElevation
            variant='contained'
            size='large'
            color='primary'
        >
            {/* Validate the player's answer */}
            <Button
                color='success'
                startIcon={<CheckCircleIcon />}
                onClick={() => handleClick(true)}
                disabled={isHandling}
            >
                {VALIDATE_ANSWER[lang]}
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={() => handleClick(false)}
                disabled={isHandling}
            >
                {INVALIDATE_ANSWER[lang]}
            </Button>
        </ButtonGroup>
    </>
}
