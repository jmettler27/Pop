
import { useGameContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'

import HomeIcon from '@mui/icons-material/Home';
import { goBackFinaleHome } from '@/app/(game)/lib/question/finale';
import { useAsyncAction } from '@/lib/utils/async';


export default function GoFinaleHomeButton() {
    const game = useGameContext()

    const [handleContinueClick, isHandling] = useAsyncAction(async () => {
        await goBackFinaleHome(game.id, game.currentRound)
    })

    return (
        <Button
            size='large'
            startIcon={<HomeIcon />}
            variant='contained'
            onClick={handleContinueClick}
            disabled={isHandling}
        >
            Retourner aux thèmes
        </Button>
    )
}