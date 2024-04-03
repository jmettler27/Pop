import { useParams } from "next/navigation"

import { useEffect, useRef, useState } from "react"

import { useUserContext } from "@/app/contexts"
import { useGameContext, useRoleContext } from "@/app/(game)/contexts"

import Timer from '@/app/(game)/[id]/components/timer/Timer'
import OrganizerTimerController from '@/app/(game)/[id]/components/timer/OrganizerTimerController'

import { handleRoundQuestionEnd } from "@/app/(game)/lib/round/round-transitions"

import { doc, onSnapshot } from "firebase/firestore"
import { GAMES_COLLECTION_REF } from "@/lib/firebase/firestore"
import { useDocumentData } from "react-firebase-hooks/firestore"

export default function QuestionEndCountdown({ isRoundEnd, lang = 'en' }) {
    console.log("RENDERED QuestionEndCountdown")

    const { id: gameId } = useParams();
    const myRole = useRoleContext();

    const timerDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer')

    // const timer = useRef(null)

    // useEffect(() => {
    //     const unsubscribe = onSnapshot(timerDocRef, snapshot => {
    //         const newTimer = snapshot.data()
    //         if (newTimer != timer.current) {
    //             console.log("==============================================================")
    //             console.log("TIMER UPDATED:", newTimer)
    //             timer.current = newTimer
    //         }
    //     })
    //     return () => unsubscribe()
    // })

    // if (!timer || !timer.current)
    //     return <></>

    const [timer, loading, error] = useDocumentData(timerDocRef)
    if (!timer || loading || error)
        return <></>


    return (
        // <div className='flex flex-col h-full items-center justify-center'>
        <div className='flex flex-col items-center'>
            <span className='text-3xl'>{isRoundEnd ? QUESTION_END_COUNTDOWN_ROUND_END_TEXT[lang] : QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT[lang]} dans</span>

            {(myRole === 'organizer') ?
                <QuestionEndOrganizerCountdownController timer={timer} /> :

                <span className='text-3xl'>
                    <Timer timer={timer} />
                </span>
            }

        </div>
    )
}

function QuestionEndOrganizerCountdownController({ timer }) {
    const user = useUserContext();
    const game = useGameContext();

    const isManager = true //user.id === managerId

    const hasExecuted = useRef(false)

    const handleCountdownEnd = async () => {
        if (isManager && !hasExecuted.current) {
            console.log("HERE", hasExecuted.current)
            hasExecuted.current = true
            await handleRoundQuestionEnd(game.id, game.currentRound)
        }
    }

    return <OrganizerTimerController timer={timer} onTimerEnd={handleCountdownEnd} />

}

const QUESTION_END_COUNTDOWN_ROUND_END_TEXT = {
    'en': "End of round",
    'fr-FR': "Fin de manche"
}

const QUESTION_END_COUNTDOWN_NEXT_QUESTION_TEXT = {
    'en': "Next question",
    'fr-FR': "Prochaine question"
}