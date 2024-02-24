import { useGameContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'
import SkipNextIcon from '@mui/icons-material/SkipNext'

import { organizerEndQuestion } from '@/app/(game)/lib/question'
import { useAsyncAction } from '@/lib/utils/async'

/**
 * End the question
 * @returns 
 */
export default function EndQuestionButton() {
    const game = useGameContext()

    const [handleEndQuestion, isEnding] = useAsyncAction(async () => {
        await organizerEndQuestion(game.id, game.currentRound, game.currentQuestion)
    })

    return (
        <Button
            variant='outlined'
            color='warning'
            startIcon={<SkipNextIcon />}
            onClick={handleEndQuestion}
            disabled={isEnding}
        >
            End question
        </Button>
    )
}