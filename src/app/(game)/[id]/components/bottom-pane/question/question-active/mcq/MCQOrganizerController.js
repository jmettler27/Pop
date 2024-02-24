import { useGameContext } from '@/app/(game)/contexts'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'

import { handleHideAnswer } from '@/app/(game)/lib/question/mcq'
import { GameChooserHelperText } from '@/app/(game)/[id]/components/GameChooserTeamAnnouncement'
import MCQPlayerOptionHelperText from './MCQPlayerOptionHelperText'
import { useAsyncAction } from '@/lib/utils/async'


export default function MCQOrganizerController({ realtime }) {
    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            {/* <BuzzerHeadPlayer realtime={realtime} />
            */}
            {realtime.option === null && (
                <span className='text-4xl font-bold'><GameChooserHelperText chooserTeamId={realtime.teamId} /></span>
            )}
            {realtime.option !== null && (
                <span className='text-4xl'><MCQPlayerOptionHelperText realtime={realtime} /></span>
            )}
            {realtime.option === 'hide' && <MCQOrganizerHideAnswerController realtime={realtime} />}
            <MCQOrganizerQuestionController />
        </div>
    )
}


function MCQOrganizerHideAnswerController({ realtime }) {
    const game = useGameContext()

    const [handleClick, isHandling] = useAsyncAction(async (correct) => {
        await handleHideAnswer(game.id, game.currentRound, game.currentQuestion, realtime.playerId, realtime.teamId, correct)
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
                Validate
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={() => handleClick(false)}
                disabled={isHandling}
            >
                Cancel
            </Button>
        </ButtonGroup>
    </>
}



function MCQOrganizerQuestionController() {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton />
            <EndQuestionButton />
        </div>
    )
}
