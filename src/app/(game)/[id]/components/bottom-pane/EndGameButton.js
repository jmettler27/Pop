
import { useGameContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'
import { updateGameStatus } from '@/app/(game)/lib/game'


export default function EndGameButton() {
    const game = useGameContext()

    const [handleEndGame, isEnding] = useAsyncAction(async () => {
        await updateGameStatus(game.id, 'game_end')
    })

    return (
        <Button
            // startIcon={}
            variant='contained'
            onClick={handleEndGame}
            disabled={isEnding}
        >
            End Game
        </Button>
    )
}