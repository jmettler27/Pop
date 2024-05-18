import { useRef } from "react"

import { useUserContext } from "@/app/contexts"
import { useGameContext, useRoleContext } from "@/app/(game)/contexts"

import Timer from '@/app/(game)/[id]/components/timer/Timer'
import OrganizerTimerController from '@/app/(game)/[id]/components/timer/OrganizerTimerController'
import { CircularProgress } from "@mui/material"

import { doc } from "firebase/firestore"
import { useDocumentData, useDocumentDataOnce } from "react-firebase-hooks/firestore"
import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"

import { handleRoundQuestionEnd, startRound } from "@/app/(game)/lib/round/round-transitions"
import { handleQuestionActiveCountdownEnd } from "@/app/(game)/lib/question"
import { startGame } from "@/app/(game)/lib/transitions"

import { useObject } from 'react-firebase-hooks/database';
import { SERVER_TIME_OFFSET_REF } from "@/lib/firebase/database"



export default function TimerPane() {
    return (
        <div className='flex flex-col items-center'>
            <TimerHeader lang='en' />
            <TimerController />
        </div>
    )
}


function TimerController({ }) {
    const user = useUserContext();
    const game = useGameContext();
    const myRole = useRoleContext();

    const hasExecuted = useRef(false)
    const lastExecuted = useRef(null)

    const handleTimerEnd = async (timer) => {
        console.log("Has executed:", hasExecuted.current)
        console.log("Last executed:", lastExecuted.current?.toLocaleString())
        if ((hasExecuted.current && ((Date.now() - lastExecuted.current) <= 1000)) || (timer.managedBy !== user.id)) {
            return
        }
        console.log("EXECUTING TIMER END")
        hasExecuted.current = true
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

    switch (myRole) {
        case 'organizer':
            return <OrganizerTimerController timer={timer} serverTimeOffset={serverTimeOffset} onTimerEnd={() => handleTimerEnd(timer)} />
        default:
            return <span className='2xl:text-3xl'><Timer timer={timer} serverTimeOffset={serverTimeOffset} /></span>
    }
}


function TimerHeader({ lang }) {
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

    return <span className='2xl:text-3xl'>{isRoundEnd ? QUESTION_END_COUNTDOWN_ROUND_END_TEXT[lang] : QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT[lang]}</span>
}


const QUESTION_END_COUNTDOWN_ROUND_END_TEXT = {
    'en': "End of round in",
    'fr-FR': "Fin de manche dans"
}

const QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT = {
    'en': "Next question in",
    'fr-FR': "Prochaine question dans"
}