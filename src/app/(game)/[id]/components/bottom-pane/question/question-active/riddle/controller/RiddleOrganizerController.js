import { useUserContext } from '@/app/contexts'
import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import ClearBuzzerButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/ClearBuzzerButton'
import BuzzerHeadPlayer from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'

import { updatePlayerStatus } from '@/app/(game)/lib/players'
import { handleRiddleInvalidateAnswerClick, handleRiddleValidateAnswerClick } from '@/app/(game)/lib/question/riddle'
import { handleNextClueClick } from '@/app/(game)/lib/question/progressive_clues'
import { useAsyncAction } from '@/lib/utils/async'
import { useEffect } from 'react'

export default function RiddleOrganizerController({ question, players }) {
    const game = useGameContext()

    /* Set the state 'focus' to the playerId which is the first element of the buzzed list */
    const buzzed = players.buzzed

    useEffect(() => {
        console.log('RiddleOrganizerController', game.status, buzzed)
        if (game.status === 'question_active' && buzzed.length > 0) {
            updatePlayerStatus(game.id, buzzed[0], 'focus')
        }
    }, [buzzed, game.status])

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <BuzzerHeadPlayer buzzed={buzzed} />
            <RiddleOrganizerAnswerController buzzed={buzzed} />
            <RiddleOrganizerQuestionController question={question} />
        </div>
    )
}


function RiddleOrganizerAnswerController({ buzzed }) {
    const game = useGameContext()
    const user = useUserContext()

    const buzzedIsEmpty = buzzed.length === 0

    const [handleRiddleValidate, isValidating] = useAsyncAction(async () => {
        await handleRiddleValidateAnswerClick(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    const [handleRiddleInvalidate, isInvalidating] = useAsyncAction(async () => {
        await handleRiddleInvalidateAnswerClick(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    {/* Validate or invalidate the player's answer */ }
    return <>
        <ButtonGroup
            disableElevation
            variant='contained'
            size='large'
            color='primary'
            // aria-label='outlined primary button group'
            disabled={buzzedIsEmpty}
        >
            {/* Validate the player's answer */}
            <Button
                color='success'
                startIcon={<CheckCircleIcon />}
                onClick={handleRiddleValidate}
                disabled={isValidating}
            >
                Validate
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={handleRiddleInvalidate}
                disabled={isInvalidating}
            >
                Cancel
            </Button>
        </ButtonGroup>
    </>
}


/**
 * Go to the next clue 
 * 
 * @param {*} question 
 * @returns 
 */
function NextClueButton({ question }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleClick, isLoadingNextClue] = useAsyncAction(async () => {
        await handleNextClueClick(game.id, game.currentRound, game.currentQuestion, user.id)
    })

    const realtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeRef)

    if (realtimeError || realtimeLoading || !realtime) {
        return <></>
    }
    const isLastClue = realtime.currentClueIdx >= question.details.clues.length - 1


    return (
        <Button
            variant='contained'
            size='large'
            onClick={handleClick}
            disabled={isLastClue || isLoadingNextClue}
            startIcon={<ArrowDownwardIcon />}
        >
            Next clue
        </Button>
    )
}

function RiddleOrganizerQuestionController({ question }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            {/* Next clue */}
            {question.type === 'progressive_clues' && <NextClueButton question={question} />}
            <ResetQuestionButton />
            <EndQuestionButton />
            <ClearBuzzerButton />
        </div>
    )
}
