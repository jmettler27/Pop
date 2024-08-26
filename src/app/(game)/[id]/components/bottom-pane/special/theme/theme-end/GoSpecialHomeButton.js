
import { useGameContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'

import HomeIcon from '@mui/icons-material/Home';
import { goBackSpecialHome } from '@/app/(game)/lib/question/special';
import { useAsyncAction } from '@/lib/utils/async';


export default function GoSpecialHomeButton() {
    const game = useGameContext()

    const [handleContinueClick, isHandling] = useAsyncAction(async () => {
        await goBackSpecialHome(game.id, game.currentRound)
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