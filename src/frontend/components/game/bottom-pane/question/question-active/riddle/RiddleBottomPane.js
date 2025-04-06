import { UserRole } from '@/backend/models/users/User'

import RoundRiddleQuestionRepository from '@/backend/repositories/question/game/GameRiddleQuestionRepository'


import { useGameContext, useRoleContext } from '@/frontend/contexts'

import RiddlePlayerController from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/RiddlePlayerController'
import RiddleOrganizerController from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/RiddleOrganizerController'
import RiddleSpectatorController from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/RiddleSpectatorController'
import RiddlePlayers from '@/frontend/components/game/bottom-pane/question/question-active/riddle/players/RiddlePlayers'


export default function RiddleBottomPane({ baseQuestion }) {
    const game = useGameContext()

    const roundRiddleQuestionRepo = new RoundRiddleQuestionRepository(game.id, game.currentRound)
    const { players, playersLoading, playersError } = roundRiddleQuestionRepo.usePlayers(game.currentQuestion)

    if (playersError) {
        return <p><strong>Error: </strong>{JSON.stringify(playersError)}</p>
    }
    if (playersLoading) {
        return <></>
    }
    if (!players) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>

            {/* Left part: controller */}
            <div className='basis-3/4'>
                <RiddleController baseQuestion={baseQuestion} players={players} />
            </div>

            {/* Right part: list of riddle players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <RiddlePlayers players={players} />
            </div>
        </div>
    )
}

function RiddleController({ baseQuestion, players }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case UserRole.PLAYER:
            return <RiddlePlayerController players={players} />
        case UserRole.ORGANIZER:
            return <RiddleOrganizerController baseQuestion={baseQuestion} players={players} />
        default:
            return <RiddleSpectatorController players={players} />
    }
}