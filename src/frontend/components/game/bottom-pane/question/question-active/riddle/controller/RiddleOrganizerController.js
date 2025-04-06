import { useGameContext } from '@/frontend/contexts'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/ResetQuestionButton'
import ClearBuzzerButton from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/ClearBuzzerButton'
import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'

import { handleRiddleBuzzerHeadChanged, invalidateRiddleAnswer, validateRiddleAnswer } from '@/backend/services/question/riddle/actions_old'
import { revealProgressiveClue } from '@/backend/services/question/progressive-clues/actions_old'
import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"
import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { DEFAULT_LOCALE } from '@/frontend/utils/locales'
import { INVALIDATE_ANSWER, VALIDATE_ANSWER } from '@/backend/utils/question/question'

import { QuestionType } from '@/backend/models/questions/QuestionType'
import RoundProgressiveCluesQuestionRepository from '@/backend/repositories/question/game/GameProgressiveCluesQuestionRepository'

export default function RiddleOrganizerController({ baseQuestion, players: questionPlayers }) {
    const { id: gameId } = useParams()

    /* Set the state 'focus' to the playerId which is the first element of the buzzed list */
    const { buzzed } = questionPlayers
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
            <RiddleOrganizerQuestionController baseQuestion={baseQuestion} />
        </div>
    )
}


function RiddleOrganizerAnswerController({ buzzed, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const buzzedIsEmpty = buzzed.length === 0

    const [handleRiddleValidate, isValidating] = useAsyncAction(async () => {
        await validateRiddleAnswer(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    const [handleRiddleInvalidate, isInvalidating] = useAsyncAction(async () => {
        await invalidateRiddleAnswer(game.id, game.currentRound, game.currentQuestion, buzzed[0])
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
                {VALIDATE_ANSWER[lang]}
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={handleRiddleInvalidate}
                disabled={isInvalidating}
            >
                {INVALIDATE_ANSWER[lang]}
            </Button>
        </ButtonGroup>
    </>
}

function RiddleOrganizerQuestionController({ baseQuestion }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            {/* Next clue */}
            {baseQuestion.type === QuestionType.PROGRESSIVE_CLUES && <NextClueButton baseQuestion={baseQuestion} />}
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
function NextClueButton({ baseQuestion, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleClick, isLoadingNextClue] = useAsyncAction(async () => {
        await revealProgressiveClue(game.id, game.currentRound, game.currentQuestion)
    })

    const roundProgressiveCluesQuestionRepo = new RoundProgressiveCluesQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = roundProgressiveCluesQuestionRepo.useQuestion(game.currentQuestion)

    if (gameQuestionError) {
        return <p><strong>Error: </strong>{JSON.stringify(gameQuestionError)}</p>
    }
    if (gameQuestionLoading) {
        return <></>
    }
    if (!gameQuestion) {
        return <></>
    }
    const isLastClue = gameQuestion.currentClueIdx >= baseQuestion.clues.length - 1


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
