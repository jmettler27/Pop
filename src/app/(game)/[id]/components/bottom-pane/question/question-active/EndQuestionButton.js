import { useGameContext } from '@/app/(game)/contexts'

import { Button } from '@mui/material'
import SkipNextIcon from '@mui/icons-material/SkipNext'

import { endQuestion } from '@/app/(game)/lib/question'
import { useAsyncAction } from '@/lib/utils/async'

/**
 * End the question
 * @returns 
 */
export default function EndQuestionButton({ lang = 'fr-FR' }) {
    const game = useGameContext()

    const [handleEndQuestion, isEnding] = useAsyncAction(async () => {
        await endQuestion(game.id, game.currentRound, game.currentQuestion)
    })

    return (
        <Button
            variant='outlined'
            color='warning'
            startIcon={<SkipNextIcon />}
            onClick={handleEndQuestion}
            disabled={isEnding}
        >
            {END_QUESTION_BUTTON_LABEL[lang]}
        </Button>
    )
}

const END_QUESTION_BUTTON_LABEL = {
    'en': 'End question',
    'fr-FR': 'Terminer la question'
}