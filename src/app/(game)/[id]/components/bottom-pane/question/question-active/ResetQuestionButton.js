import { useGameContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

import { updateAllPlayersStatuses } from '@/app/(game)/lib/players'
import { resetQuestion } from '@/app/(game)/lib/question'
import { useAsyncAction } from '@/lib/utils/async'

/**
 * Reset the question
 * @returns 
 */
export default function ResetQuestionButton({ }) {
    const game = useGameContext()

    const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
        await Promise.all([
            updateAllPlayersStatuses(game.id, 'idle'),
            resetQuestion(game.id, game.currentRound, game.currentQuestion)
        ]);
    })

    return (
        <Button
            variant='outlined'
            color='warning'
            startIcon={<RestartAltIcon />}
            onClick={handleResetQuestion}
            disabled={isResetting}
        >
            Reset question
        </Button>
    )
}
