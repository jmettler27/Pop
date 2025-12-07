import { GameStatus } from '@/backend/models/games/GameStatus'


import LoadingScreen from '@/frontend/components/LoadingScreen'

import { useGameContext, useGameRepositoriesContext } from '@/frontend/contexts'

import RoundStartBottomPane from '@/frontend/components/game/bottom-pane/round/round-start/RoundStartBottomPane'
import RoundEndBottomPane from '@/frontend/components/game/bottom-pane/round/round-end/RoundEndBottomPane'


export default function RoundBottomPane() {
    const game = useGameContext()
    console.log('game', game)
    
    const { roundRepo } = useGameRepositoriesContext()
    console.log("Current round", game.currentRound)

    if (!game.currentRound) {
        return <></>
    }

    const { round, loading: roundLoading, error: roundError } = roundRepo.useRound(game.currentRound)
    console.log('round', round)

    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <LoadingScreen loadingText="Loading round..." />
    }
    if (!round) {
        return <></>
    }

    switch (game.status) {
        case GameStatus.ROUND_START:
            return <RoundStartBottomPane />
        case GameStatus.ROUND_END:
            return <RoundEndBottomPane endedRound={round} />
    }

}
