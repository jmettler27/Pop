
import { useEffect, useRef, useState } from 'react'
import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc, onSnapshot, query } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import Timer from '@/app/(game)/[id]/components/Timer'
import ContinuePlayerController from '@/app/(game)/[id]/components/bottom-pane/ContinuePlayerController'
import QuestionManagerAnnouncement from '@/app/(game)/[id]/components/bottom-pane/question/QuestionManagerAnnouncement'

import { handleRoundQuestionEnd } from '@/app/(game)/lib/round/round-transitions';
import { startTimer, updateTimerState } from '@/app/(game)/lib/timer'

import { Button } from '@mui/material'
import FastForwardIcon from '@mui/icons-material/FastForward'
import ScoreboardIcon from '@mui/icons-material/Scoreboard'
import { useAsyncAction } from '@/lib/utils/async'

export default function QuestionEndBottomPane({ }) {
    const game = useGameContext();

    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    const [realtime, realtimeLoading, realtimeError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion))
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (roundLoading || realtimeLoading) {
        return <></>
    }
    if (!round || !realtime) {
        return <></>
    }

    const isRoundEnd = round.currentQuestionIdx === round.questions.length - 1

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-5'>
            <QuestionEndText isRoundEnd={isRoundEnd} managerId={realtime.managedBy} />
            <QuestionEndController isRoundEnd={isRoundEnd} managerId={realtime.managedBy} />
        </div>
    )
}

function QuestionEndText({ isRoundEnd, managerId, lang = 'en' }) {
    const user = useUserContext();
    const game = useGameContext();
    const myRole = useRoleContext();

    const isManager = (myRole === 'organizer' && user.id === managerId)

    const readyPlayers = useRef([])
    const allReady = useRef(false)
    const hasExecuted = useRef(false)

    useEffect(() => {
        const playersCollectionRef = collection(GAMES_COLLECTION_REF, game.id, 'players')
        const q = query(playersCollectionRef)
        const unsubscribe = onSnapshot(q, snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "modified") {
                    const modifiedPlayer = { ...change.doc.data(), id: change.doc.id }
                    if (modifiedPlayer.status === 'ready' && !readyPlayers.current.includes(modifiedPlayer.id)) {
                        readyPlayers.current.push(modifiedPlayer.id)
                        if (readyPlayers.current.length === snapshot.docs.length) {
                            if (isManager) {
                                updateTimerState(game.id, 'started')
                            }
                        }
                    }
                }
            });
        })
        // Clean up the listener when the component unmounts
        return () => unsubscribe()
    }, [])

    const handleEndCountdown = async () => {
        if (isManager && !hasExecuted.current) {
            hasExecuted.current = true
            await handleRoundQuestionEnd(game.id, game.currentRound, game.currentQuestion, isRoundEnd)
        }
    }

    if (allReady.current) {
        return <QuestionEndCountdownController isRoundEnd={isRoundEnd} onTimerEnd={handleEndCountdown} />
    }

    if (myRole === 'player') {
        return <span className='text-3xl'>{QUESTION_END_PLAYER_TEXT_HEADER[lang]} <strong>{isRoundEnd ? QUESTION_END_PLAYER_ROUND_END_TEXT[lang] : QUESTION_END_PLAYER_NEXT_QUESTION_TEXT[lang]}</strong>? 🥸</span>
    }
    return <span className='text-3xl'>{QUESTION_END_WAITING_TEXT[lang]}</span>
}

const QUESTION_END_PLAYER_TEXT_HEADER = {
    'en': "Ready for",
    'fr-FR': "Chaud pour"
}

const QUESTION_END_PLAYER_ROUND_END_TEXT = {
    'en': "the end of the round",
    'fr-FR': "la fin de la manche"
}

const QUESTION_END_PLAYER_NEXT_QUESTION_TEXT = {
    'en': "the next question",
    'fr-FR': "la prochaine question"
}

const QUESTION_END_WAITING_TEXT = {
    'en': "Waiting for players...",
    'fr-FR': "En attente des joueurs..."
}


function QuestionEndCountdownController({ isRoundEnd, onTimerEnd }) {
    console.log("RENDERED QuestionEndCountdownController")
    const game = useGameContext()

    const [timer, timerLoading, timerError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'timer'))
    if (timerError) {
        return <p><strong>Error: {JSON.stringify(timerError)}</strong></p>
    }
    if (timerLoading) {
        return <></>
    }
    if (!timer) {
        return <></>
    }

    return (
        <div className='flex flex-col items-center'>
            <span className='text-3xl'>{isRoundEnd ? "Fin de manche" : "Prochaine question"} dans</span>
            <span className='text-3xl'><Timer
                forward={timer.forward}
                duration={timer.duration}
                status={timer.status}
                onTimerEnd={onTimerEnd} />
            </span>
        </div>
    )

}

function QuestionEndController({ isRoundEnd, managerId }) {
    const myRole = useRoleContext();

    switch (myRole) {
        case 'organizer':
            return <QuestionEndOrganizerController isRoundEnd={isRoundEnd} managerId={managerId} />
        case 'player':
            return <ContinuePlayerController />
        default:
            return <></>
    }
}

function QuestionEndOrganizerController({ isRoundEnd, managerId, lang = 'en' }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleContinueClick, isEnding] = useAsyncAction(async () => {
        await handleRoundQuestionEnd(game.id, game.currentRound, game.currentQuestion, isRoundEnd)
    })

    // if (question.manager !== user.id) {
    //     return <QuestionManagerAnnouncement managerId={question.manager} />
    // }

    return (
        <Button
            className='rounded-full'
            color='secondary'
            size='large'
            variant='outlined'
            onClick={handleContinueClick}
            disabled={isEnding}
            startIcon={isRoundEnd ? <ScoreboardIcon /> : <FastForwardIcon />}
        >
            {isRoundEnd ? QUESTION_END_ORGANIZER_ROUND_END_TEXT[lang] : QUESTION_END_ORGANIZER_NEXT_QUESTION_TEXT[lang]}
        </Button>
    )

}

const QUESTION_END_ORGANIZER_ROUND_END_TEXT = {
    'en': "End the round",
    'fr-FR': "Terminer la manche"
}

const QUESTION_END_ORGANIZER_NEXT_QUESTION_TEXT = {
    'en': "Switch directly to the next question",
    'fr-FR': "Passer directement à la prochaine question"
}