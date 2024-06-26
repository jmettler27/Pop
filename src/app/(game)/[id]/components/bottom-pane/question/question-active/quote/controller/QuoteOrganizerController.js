import { useParams } from 'next/navigation'

import { useEffect, useRef } from 'react'

import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { Button, ButtonGroup, CircularProgress } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

import EndQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/EndQuestionButton'
import ResetQuestionButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/ResetQuestionButton'
import ClearBuzzerButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/ClearBuzzerButton'
import BuzzerHeadPlayer from '@/app/(game)/[id]/components/bottom-pane/question/question-active/riddle/controller/BuzzerHeadPlayer'
import RevealQuoteElementButton from '@/app/(game)/[id]/components/bottom-pane/question/question-active/quote/controller/RevealQuoteElement'

import { handleRiddleBuzzerHeadChanged } from '@/app/(game)/lib/question/riddle'
import { cancelQuotePlayer, validateAllQuoteElements } from '@/app/(game)/lib/question/quote'

import { DEFAULT_LOCALE } from '@/lib/utils/locales'
import { useAsyncAction } from '@/lib/utils/async'
import { isEmpty } from '@/lib/utils/arrays'
import { atLeastOneElementRevealed } from '@/lib/utils/question/quote'


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

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(questionRealtimeRef)
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <CircularProgress />
    }
    if (!realtime) {
        return <></>
    }
    const { revealed } = realtime

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
                <ValidateAllQuoteElementsButton buzzed={buzzed} revealed={revealed} />
                <CancelQuoteElementButton buzzed={buzzed} />
                <RevealQuoteElementButton buzzed={buzzed} question={question} revealed={revealed} />
            </ButtonGroup>
        </>
    )
}

function ValidateAllQuoteElementsButton({ buzzed, revealed, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const atLeastOneRevealed = atLeastOneElementRevealed(revealed)
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
