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

import { handleRiddleBuzzerHeadChanged, handleRiddleInvalidateAnswerClick, handleRiddleValidateAnswerClick } from '@/app/(game)/lib/question/riddle'
import { handleNextClueClick } from '@/app/(game)/lib/question/progressive_clues'
import { useAsyncAction } from '@/lib/utils/async'
import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'

export default function RiddleOrganizerController({ question, players }) {
    const { id: gameId } = useParams()

    /* Set the state 'focus' to the playerId which is the first element of the buzzed list */
    const { buzzed } = players
    const buzzerHead = useRef()

    useEffect(() => {
        if (!buzzed || buzzed.length === 0) {
            buzzerHead.current = null
            return
        }
        if (buzzerHead.current !== buzzed[0]) {
            buzzerHead.current = buzzed[0]
            handleRiddleBuzzerHeadChanged(gameId, buzzerHead.current)
        }
    }, [buzzed])

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

/**
 * Go to the next clue 
 * 
 * @param {*} question 
 * @returns 
 */
function NextClueButton({ question, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleClick, isLoadingNextClue] = useAsyncAction(async () => {
        await handleNextClueClick(game.id, game.currentRound, game.currentQuestion)
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
            {NEXT_CLUE[lang]}
        </Button>
    )
}

const NEXT_CLUE = {
    'en': 'Next clue',
    'fr-FR': 'Prochain indice',
}
