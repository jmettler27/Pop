
import { useGameContext, useRoleContext } from "@/app/(game)/contexts"

import Timer from '@/app/(game)/[id]/components/Timer'
import EnumOrganizerTimerController from '@/app/(game)/[id]/components/bottom-pane/question/question-active/enum/enum-controller/EnumOrganizerTimerController'
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
                <EnumOrganizerTimerController question={question} timer={timer} onTimerEnd={handleChallengeActive} /> :
                <span className='text-4xl'><Timer
                    forward={false}
                    duration={question.details.challengeTime}
                    status={timer.status}
                    onTimerEnd={() => { }} />
                </span>
            }
        </div>
    )
}
