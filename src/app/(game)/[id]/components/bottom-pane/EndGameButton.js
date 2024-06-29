
import { useGameContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'
import { updateGameStatus } from '@/app/(game)/lib/game'
import { useAsyncAction } from '@/lib/utils/async'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'


export default function EndGameButton({ lang = DEFAULT_LOCALE }) {
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
            color='warning'
        >
            {END_GAME[lang]}
        </Button>
    )
}

const END_GAME = {
    'en': "End Game",
    'fr-FR': "Terminer la partie",
}

