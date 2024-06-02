import { useRef } from "react"

import { useUserContext } from "@/app/contexts"
import { useGameContext, useRoleContext } from "@/app/(game)/contexts"

import Timer from '@/app/(game)/[id]/components/timer/Timer'
import OrganizerTimerController from '@/app/(game)/[id]/components/timer/OrganizerTimerController'
import { CircularProgress } from "@mui/material"
import AuthorizePlayersSwitch from "@/app/(game)/[id]/components/bottom-pane/AuthorizePlayersSwitch"

import { doc } from "firebase/firestore"
import { useDocumentData, useDocumentDataOnce } from "react-firebase-hooks/firestore"
import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"

import { handleRoundQuestionEnd, startRound } from "@/app/(game)/lib/round/round-transitions"
import { handleQuestionActiveCountdownEnd } from "@/app/(game)/lib/question"
import { startGame } from "@/app/(game)/lib/transitions"

import { useObject } from 'react-firebase-hooks/database';
import { SERVER_TIME_OFFSET_REF } from "@/lib/firebase/database"

export default function TimerPane() {
    const myRole = useRoleContext();
    return myRole === 'organizer' ? <OrganizerTimerPane /> : <SpectatorTimerPane />
}


function OrganizerTimerPane() {
    const user = useUserContext();
    const game = useGameContext();

    const lastExecuted = useRef(null)

    const handleTimerEnd = async (timer) => {
        console.log("Last executed:", lastExecuted.current?.toLocaleString())
        if (lastExecuted.current && ((Date.now() - lastExecuted.current) <= 1000)) {
            console.log("HANDLE TIMER END: RETURN")
            return
        }
        if (timer.managedBy !== user.id) {
            console.log("HANDLE TIMER END: NOT MANAGED BY ME")
            return
        }

        console.log("HANDLE TIMER END: EXECUTING")
        lastExecuted.current = Date.now()

        switch (game.status) {
            case 'game_start':
                await startGame(game.id)
                break
            case 'round_start':
                await startRound(game.id, game.currentRound)
                break
            case 'question_active':
                await handleQuestionActiveCountdownEnd(game.id, game.currentRound, game.currentQuestion)
                break
            case 'question_end':
                await handleRoundQuestionEnd(game.id, game.currentRound)
                break
        }
    }

    const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);

    const timerDocRef = doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'timer')
    const [timer, timerLoading, timerError] = useDocumentData(timerDocRef)


    if (offsetError) {
        return <p><strong>Error: {JSON.stringify(offsetError)}</strong></p>
    }
    if (timerError) {
        return <p><strong>Error: {JSON.stringify(timerError)}</strong></p>
    }
    if (offsetLoading || timerLoading) {
        return <CircularProgress />
    }
    if (!offsetSnapshot || !timer) {
        return <></>
    }

    const serverTimeOffset = offsetSnapshot.val()

    console.log("TIMER PANE RENDERED:",)
    console.log("- Server time offset (MS): ", serverTimeOffset)
    console.log("- Timer:", timer)

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-2'>
            <TimerHeader />
            <OrganizerTimerController timer={timer} serverTimeOffset={serverTimeOffset} onTimerEnd={() => handleTimerEnd(timer)} />
            <AuthorizePlayersSwitch authorized={timer.authorized} />
        </div>
    )
}


function SpectatorTimerPane() {
    const game = useGameContext();

    const [offsetSnapshot, offsetLoading, offsetError] = useObject(SERVER_TIME_OFFSET_REF);

    const timerDocRef = doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'timer')
    const [timer, timerLoading, timerError] = useDocumentData(timerDocRef)


    if (offsetError) {
        return <p><strong>Error: {JSON.stringify(offsetError)}</strong></p>
    }
    if (timerError) {
        return <p><strong>Error: {JSON.stringify(timerError)}</strong></p>
    }
    if (offsetLoading || timerLoading) {
        return <CircularProgress />
    }
    if (!offsetSnapshot || !timer) {
        return <></>
    }

    const serverTimeOffset = offsetSnapshot.val()

    console.log("SPECTATOR TIMER PANE RENDERED:",)
    console.log("- Server time offset (MS): ", serverTimeOffset)
    console.log("- Timer:", timer)

    return (
        <div className='flex flex-col h-full items-center justify-center space-y-2'>
            <TimerHeader />
            <span className='2xl:text-4xl'>⌛ <Timer timer={timer} serverTimeOffset={serverTimeOffset} /></span>
        </div>
    )
}



function TimerHeader({ lang = 'fr-FR' }) {
    const game = useGameContext();

    switch (game.status) {
        case 'game_start':
            return <span className='2xl:text-2xl'>{GAME_START_COUNTDOWN_TEXT[lang]}</span>
        case 'round_start':
            return <span className='2xl:text-2xl'>{ROUND_START_COUNTDOWN_TEXT[lang]}</span>
        case 'question_end':
            return <QuestionEndTimerHeader lang={lang} />
        default:
            return <></>
    }
}

// GAME START
const GAME_START_COUNTDOWN_TEXT = {
    'en': "Game starting in",
    'fr-FR': "Début de la partie dans"
}

// ROUND START
const ROUND_START_COUNTDOWN_TEXT = {
    'en': "First question in",
    'fr-FR': "Première question dans"
}

// QUESTION END
function QuestionEndTimerHeader({ lang }) {
    const game = useGameContext();

    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))

    if (roundError) {
        return <p><strong>Error: {JSON.stringify(readyError)}</strong></p>
    }
    if (roundLoading) {
        return <></>
    }
    if (!round) {
        return <></>
    }

    const isRoundEnd = round.currentQuestionIdx === round.questions.length - 1

    return <span className='2xl:text-2xl'>{isRoundEnd ? QUESTION_END_COUNTDOWN_ROUND_END_TEXT[lang] : QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT[lang]}</span>
}


const QUESTION_END_COUNTDOWN_ROUND_END_TEXT = {
    'en': "End of round in",
    'fr-FR': "Fin de manche dans"
}

const QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT = {
    'en': "Next question in",
    'fr-FR': "Prochaine question dans"
}