import { UserRole } from '@/backend/models/users/User'

import RoundQuoteQuestionRepository from '@/backend/repositories/question/game/GameQuoteQuestionRepository'


import { useGameContext, useRoleContext } from '@/frontend/contexts'

import QuoteOrganizerController from '@/frontend/components/game/bottom-pane/question/question-active/quote/controller/QuoteOrganizerController'
import RiddleSpectatorController from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/RiddleSpectatorController'
import RiddlePlayerController from '@/frontend/components/game/bottom-pane/question/question-active/riddle/controller/RiddlePlayerController'
import RiddlePlayers from '@/frontend/components/game/bottom-pane/question/question-active/riddle/players/RiddlePlayers'


export default function QuoteBottomPane({ baseQuestion }) {
    const game = useGameContext()

    const roundQuoteQuestionRepo = new RoundQuoteQuestionRepository(game.id, game.currentRound)
    const { players, loading, error } = roundQuoteQuestionRepo.usePlayers(game.currentQuestion)

    if (error) {
        return <p><strong>Error: </strong>{JSON.stringify(error)}</p>
    }
    if (loading) {
        return <></>
    }
    if (!players) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full divide-x divide-solid'>

            {/* Left part: controller */}
            <div className='basis-3/4'>
                <QuoteController baseQuestion={baseQuestion} players={players} />
            </div>

            {/* Right part: list of Quote players who buzzed and/or were canceled */}
            <div className='basis-1/4'>
                <RiddlePlayers players={players} />
            </div>
        </div>
    )
}

function QuoteController({ baseQuestion, players }) {
    const myRole = useRoleContext()

    switch (myRole) {
        case UserRole.PLAYER:
            return <RiddlePlayerController players={players} />
        case UserRole.ORGANIZER:
            return <QuoteOrganizerController baseQuestion={baseQuestion} players={players} />
        default:
            return <RiddleSpectatorController players={players} />
    }
}
