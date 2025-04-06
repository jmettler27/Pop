import { handleRiddleBuzzerHeadChanged } from '@/backend/services/question/riddle/actions_old'
import { cancelQuotePlayer, validateAllQuoteElements } from '@/backend/services/question/quote/actions_old'

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'
import { isEmpty } from '@/backend/utils/arrays'


import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { useGameContext } from '@/frontend/contexts'
import EndQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/frontend/components/game/bottom-pane/question/question-active/ResetQuestionButton'
import ClearBuzzerButton from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/ClearBuzzerButton'
import BuzzerHeadPlayer from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'
import RevealQuoteElementButton from '@/frontend/components/game/bottom-pane/question/question-active/quote/controller/RevealQuoteElement'

import { useParams } from 'next/navigation'

import { useEffect, useRef } from 'react'

import { Button, ButtonGroup, CircularProgress } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RoundQuoteQuestionRepository from '@/backend/repositories/question/game/GameQuoteQuestionRepository'



export default function QuoteOrganizerController({ question, players }) {
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
            <QuoteOrganizerAnswerController buzzed={buzzed} question={question} />
            <QuoteOrganizerQuestionController />
        </div>
    )
}


function QuoteOrganizerAnswerController({ buzzed, question }) {
    const game = useGameContext()

    const gameQuestionRepo = new RoundQuoteQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion()


    if (gameQuestionError) {
        return <p><strong>Error: {JSON.stringify(gameQuestionError)}</strong></p>
    }
    if (gameQuestionLoading) {
        return <CircularProgress />
    }
    if (!gameQuestion) {
        return <></>
    }

    const revealed = gameQuestion.revealed

    {/* Validate or invalidate the player's answer */ }
    return (
        <>
            <ButtonGroup
                disableElevation
                variant='contained'
                size='large'
                color='primary'
            // aria-label='outlined primary button group'
            >
                <ValidateAllQuoteElementsButton buzzed={buzzed} gameQuestion={gameQuestion} />
                <CancelQuoteElementButton buzzed={buzzed} />
                <RevealQuoteElementButton buzzed={buzzed} question={question} gameQuestion={gameQuestion} />
            </ButtonGroup>
        </>
    )
}

function ValidateAllQuoteElementsButton({ buzzed, gameQuestion, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const atLeastOneRevealed = gameQuestion.atLeastOneElementRevealed()
    const buzzedIsEmpty = isEmpty(buzzed)

    const [handleValidateAll, isValidating] = useAsyncAction(async () => {
        await validateAllQuoteElements(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    return (
        <Button
            color='success'
            startIcon={<CheckCircleIcon />}
            onClick={handleValidateAll}
            disabled={atLeastOneRevealed || buzzedIsEmpty || isValidating}
        >
            {VALIDATE_ALL_QUOTE_ELEMENTS[lang]}
        </Button>

    )
}

const VALIDATE_ALL_QUOTE_ELEMENTS = {
    'en': "Validate all",
    'fr-FR': "Tout valider"
}


function CancelQuoteElementButton({ buzzed, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const buzzedIsEmpty = isEmpty(buzzed)

    const [handleCancelQuote, isCanceling] = useAsyncAction(async () => {
        await cancelQuotePlayer(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    return (
        <>
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={handleCancelQuote}
                disabled={buzzedIsEmpty || isCanceling}
            >
                {CANCEL_QUOTE_ELEMENT[lang]}
            </Button>
        </>

    )
}

const CANCEL_QUOTE_ELEMENT = {
    'en': "Cancel",
    'fr-FR': "Invalider"
}


function QuoteOrganizerQuestionController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton />
            <EndQuestionButton />
            <ClearBuzzerButton />
        </div>
    )
}
