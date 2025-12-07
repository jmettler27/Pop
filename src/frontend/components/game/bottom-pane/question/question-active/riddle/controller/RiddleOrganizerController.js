import { handleBuzzerHeadChanged as handleBasicBuzzerHeadChanged, invalidateAnswer as invalidateBasicAnswer, validateAnswer as validateBasicAnswer } from '@/backend/services/question/basic/actions'
import { handleBuzzerHeadChanged as handleBlindtestBuzzerHeadChanged, invalidateAnswer as invalidateBlindtestAnswer, validateAnswer as validateBlindtestAnswer } from '@/backend/services/question/blindtest/actions'
import { handleBuzzerHeadChanged as handleEmojiBuzzerHeadChanged, invalidateAnswer as invalidateEmojiAnswer, validateAnswer as validateEmojiAnswer } from '@/backend/services/question/emoji/actions'
import { handleBuzzerHeadChanged as handleImageBuzzerHeadChanged, invalidateAnswer as invalidateImageAnswer, validateAnswer as validateImageAnswer } from '@/backend/services/question/image/actions'
import { handleBuzzerHeadChanged as handleProgressiveCluesBuzzerHeadChanged, invalidateAnswer as invalidateProgressiveCluesAnswer, validateAnswer as validateProgressiveCluesAnswer } from '@/backend/services/question/progressive-clues/actions'
import { handleBuzzerHeadChanged as handleQuoteBuzzerHeadChanged, invalidateAnswer as invalidateQuoteAnswer, validateAnswer as validateQuoteAnswer } from '@/backend/services/question/quote/actions'

import { QuestionType } from '@/backend/models/questions/QuestionType'

import { revealClue } from '@/backend/services/question/progressive-clues/actions'
import GameProgressiveCluesQuestionRepository from '@/backend/repositories/question/game/GameProgressiveCluesQuestionRepository'


import { INVALIDATE_ANSWER, VALIDATE_ANSWER } from '@/backend/utils/question/question'


import { useGameContext } from '@/frontend/contexts'

import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/ResetQuestionButton'
import ClearBuzzerButton from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/ClearBuzzerButton'
import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { Button, ButtonGroup } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

import { useParams } from 'next/navigation'

import { useEffect, useRef } from 'react'


export default function RiddleOrganizerController({ baseQuestion, players: questionPlayers }) {
    const { id: gameId } = useParams()

    /* Set the state 'focus' to the playerId which is the first element of the buzzed list */
    const { buzzed } = questionPlayers
    const buzzerHead = useRef()

    const getHandleBuzzerHeadChangedAction = () => {
        switch (baseQuestion.type) {
            case QuestionType.BASIC:
                return handleBasicBuzzerHeadChanged
            case QuestionType.BLINDTEST:
                return handleBlindtestBuzzerHeadChanged
            case QuestionType.EMOJI:
                return handleEmojiBuzzerHeadChanged
            case QuestionType.IMAGE:
                return handleImageBuzzerHeadChanged
            case QuestionType.PROGRESSIVE_CLUES:
                return handleProgressiveCluesBuzzerHeadChanged
            case QuestionType.QUOTE:
                return handleQuoteBuzzerHeadChanged
        }
    }

    useEffect(() => {
        if (!buzzed || buzzed.length === 0) {
            buzzerHead.current = null
            return
        }
        if (buzzerHead.current !== buzzed[0]) {
            buzzerHead.current = buzzed[0]
            const handleBuzzerHeadChangedAction = getHandleBuzzerHeadChangedAction()
            handleBuzzerHeadChangedAction(gameId, buzzerHead.current)
        }
    }, [buzzed])

    return (
        <div className='flex flex-col h-full w-full items-center justify-around'>
            <BuzzerHeadPlayer buzzed={buzzed} />
            <RiddleOrganizerAnswerController buzzed={buzzed} questionType={baseQuestion.type} />
            <RiddleOrganizerQuestionController baseQuestion={baseQuestion} />
        </div>
    )
}



function RiddleOrganizerAnswerController({ buzzed, lang = DEFAULT_LOCALE, questionType }) {
    const game = useGameContext()

    const buzzedIsEmpty = buzzed.length === 0

    const getValidateAnswerAction = () => {
    
        switch (questionType) {
            case QuestionType.BASIC:
                return validateBasicAnswer
            case QuestionType.BLINDTEST:
                return validateBlindtestAnswer
            case QuestionType.EMOJI:
                return validateEmojiAnswer
            case QuestionType.IMAGE:
                return validateImageAnswer
            case QuestionType.PROGRESSIVE_CLUES:
                return validateProgressiveCluesAnswer
            case QuestionType.QUOTE:
                return validateQuoteAnswer
        }
    
        throw new Error(`Unsupported question type: ${questionType}`)
    }
    
    const getInvalidateAnswerAction = () => {
        switch (questionType) {
            case QuestionType.BASIC:
                return invalidateBasicAnswer
            case QuestionType.BLINDTEST:
                return invalidateBlindtestAnswer
            case QuestionType.EMOJI:
                return invalidateEmojiAnswer
            case QuestionType.IMAGE:
                return invalidateImageAnswer
            case QuestionType.PROGRESSIVE_CLUES:
                return invalidateProgressiveCluesAnswer
            case QuestionType.QUOTE:
                return invalidateQuoteAnswer
        }

        throw new Error(`Unsupported question type: ${questionType}`)
    }

    const [handleValidate, isValidating] = useAsyncAction(async () => {
        const validateAnswerAction = getValidateAnswerAction()
        await validateAnswerAction(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    const [handleInvalidate, isInvalidating] = useAsyncAction(async () => {
        const invalidateAnswerAction = getInvalidateAnswerAction()
        await invalidateAnswerAction(game.id, game.currentRound, game.currentQuestion, buzzed[0])
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
                onClick={handleValidate}
                disabled={isValidating}
            >
                {VALIDATE_ANSWER[lang]}
            </Button>

            {/* Invalidate the player's answer */}
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={handleInvalidate}
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
            <ResetQuestionButton questionType={baseQuestion.type} />
            <EndQuestionButton questionType={baseQuestion.type} />
            <ClearBuzzerButton questionType={baseQuestion.type} />
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
        await revealClue(game.id, game.currentRound, game.currentQuestion)
    })

    const gameQuestionRepo = new GameProgressiveCluesQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, loading: gameQuestionLoading, error: gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion)

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
