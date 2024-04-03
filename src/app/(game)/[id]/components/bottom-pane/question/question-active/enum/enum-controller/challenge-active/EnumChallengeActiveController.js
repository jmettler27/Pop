
import { useGameContext, useRoleContext } from "@/app/(game)/contexts"

import Timer from '@/app/(game)/[id]/components/timer/Timer'
import OrganizerTimerController from '@/app/(game)/[id]/components/timer/OrganizerTimerController'

import ChallengerCitationHelper from '@/app/(game)/[id]/components/bottom-pane/question/question-active/enum/enum-controller/ChallengerCitationHelper'

import { endEnumQuestion } from "@/app/(game)/lib/question/enum"

export default function EnumChallengeActiveController({ question, timer }) {
    const game = useGameContext()
    const myRole = useRoleContext()

    const handleChallengeActive = async () => {
        await endEnumQuestion(game.id, game.currentRound, game.currentQuestion)
    }

    return (
        <div className='flex flex-col h-full items-center justify-center'>
            <ChallengerCitationHelper />

            {(myRole === 'organizer') ?
                <OrganizerTimerController question={question} timer={timer} onTimerEnd={handleChallengeActive} /> :
                <span className='text-4xl'><Timer timer={timer} /></span>
            }
        </div>
    )
}
