import { useGameContext } from '@/app/(game)/contexts'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import ClearBuzzerButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/ClearBuzzerButton'

import { useAsyncAction } from '@/lib/utils/async'
import { handleBasicAnswer } from '@/app/(game)/lib/question/basic'
import { INVALIDATE_ANSWER, VALIDATE_ANSWER } from '@/lib/utils/question/question'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'

export default function BasicQuestionOrganizerController({ realtime }) {

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <BasicQuestionOrganizerAnswerController realtime={realtime} />
            <QuestionOrganizerController />
        </div>
    )
}


function BasicQuestionOrganizerAnswerController({ realtime, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [validateBasicAnswer, isValidating] = useAsyncAction(async () => {
        await handleBasicAnswer(game.id, game.currentRound, game.currentQuestion, realtime.teamId, true)
    })

    const [invalidateBasicAnswer, isInvalidating] = useAsyncAction(async () => {
        await handleBasicAnswer(game.id, game.currentRound, game.currentQuestion, realtime.teamId, false)
    })

    {/* Validate or invalidate the player's answer */ }
    return <>
        <ButtonGroup
            disableElevation
            variant='contained'
            size='large'
            color='primary'
        // aria-label='outlined primary button group'
        >
            {/* Validate the player's answer */}
            <Button
                color='success'
                startIcon={<CheckCircleIcon />}
                onClick={validateBasicAnswer}
                disabled={isValidating}
            >
                {VALIDATE_ANSWER[lang]}
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={invalidateBasicAnswer}
                disabled={isInvalidating}
            >
                {INVALIDATE_ANSWER[lang]}
            </Button>
        </ButtonGroup>
    </>
}

function QuestionOrganizerController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton />
            <EndQuestionButton />
            <ClearBuzzerButton />
        </div>
    )
}
