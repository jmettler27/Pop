import { PlayerStatus } from '@/backend/models/users/Player'

import { updateAllPlayersStatuses } from '@/backend/services/game/player/players'
import { resetQuestion } from '@/backend/services/question/actions'

import { useGameContext } from '@/frontend/contexts'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"
import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { Button } from '@mui/material'
import RestartAltIcon from '@mui/icons-material/RestartAlt'


/**
 * Reset the question
 * @returns 
 */
export default function ResetQuestionButton({ lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleResetQuestion, isResetting] = useAsyncAction(async () => {
        await Promise.all([
            // updateAllPlayersStatuses(game.id, PlayerStatus.IDLE),
            resetQuestion(game.id, game.currentRound, game.currentQuestion, null, true)
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
            {RESET_QUESTION_BUTTON_LABEL[lang]}
        </Button>
    )
}

const RESET_QUESTION_BUTTON_LABEL = {
    'en': 'Reset question',
    'fr-FR': 'Réinitialiser la question'
}