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
import RevealLabelButton from './RevealLabelButton'

import { handleRiddleBuzzerHeadChanged } from '@/app/(game)/lib/question/riddle'

import { DEFAULT_LOCALE } from '@/lib/utils/locales'
import { useAsyncAction } from '@/lib/utils/async'
import { isEmpty } from '@/lib/utils/arrays'

import { cancelLabelPlayer, validateAllLabels } from '@/app/(game)/lib/question/label'
import { atLeastOneLabelIsRevealed } from '@/lib/utils/question/label'


export default function LabelOrganizerController({ question, players }) {
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
            <LabelOrganizerAnswerController buzzed={buzzed} question={question} />
            <LabelOrganizerQuestionController />
        </div>
    )
}


function LabelOrganizerAnswerController({ buzzed, question }) {
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
                <ValidateAllLabelsButton buzzed={buzzed} revealed={revealed} />
                <CancelLabelButton buzzed={buzzed} />
                <RevealLabelButton buzzed={buzzed} question={question} revealed={revealed} />
            </ButtonGroup>
        </>
    )
}

function ValidateAllLabelsButton({ buzzed, revealed, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const atLeastOneRevealed = atLeastOneLabelIsRevealed(revealed)
    const buzzedIsEmpty = isEmpty(buzzed)

    const [handleValidateAll, isValidating] = useAsyncAction(async () => {
        await validateAllLabels(game.id, game.currentRound, game.currentQuestion, buzzed[0])
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


function CancelLabelButton({ buzzed, lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const buzzedIsEmpty = isEmpty(buzzed)

    const [handleCancelLabel, isCanceling] = useAsyncAction(async () => {
        await cancelLabelPlayer(game.id, game.currentRound, game.currentQuestion, buzzed[0])
    })

    return (
        <>
            <Button
                color='error'
                startIcon={<CancelIcon />}
                onClick={handleCancelLabel}
                disabled={buzzedIsEmpty || isCanceling}
            >
                {CANCEL_LABEL[lang]}
            </Button>
        </>

    )
}

const CANCEL_LABEL = {
    'en': "Cancel",
    'fr-FR': "Invalider"
}


function LabelOrganizerQuestionController({ }) {
    return (
        <div className='flex flex-row w-full justify-end'>
            <ResetQuestionButton />
            <EndQuestionButton />
            <ClearBuzzerButton />
        </div>
    )
}
