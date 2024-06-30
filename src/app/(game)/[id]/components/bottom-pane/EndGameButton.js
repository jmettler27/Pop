
import { Button } from '@mui/material'
import { endGame } from '@/app/(game)/lib/game'
import { useAsyncAction } from '@/lib/utils/async'
import { DEFAULT_LOCALE } from '@/lib/utils/locales'
import { useParams } from 'next/navigation'


export default function EndGameButton({ lang = DEFAULT_LOCALE }) {
    const { id: gameId } = useParams()

    const [handleEndGame, isEnding] = useAsyncAction(async () => {
        await endGame(gameId)
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

