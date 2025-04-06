import { endQuestion } from '@/backend/services/question/actions'


import { useGameContext } from '@/frontend/contexts'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { Button } from '@mui/material'
import SkipNextIcon from '@mui/icons-material/SkipNext'


/**
 * End the question
 * @returns 
 */
export default function EndQuestionButton({ lang = DEFAULT_LOCALE }) {
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