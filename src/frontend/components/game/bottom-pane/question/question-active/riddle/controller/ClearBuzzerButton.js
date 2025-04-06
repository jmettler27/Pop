import { clearBuzzer } from '@/backend/services/question/riddle/actions_old'


import { useGameContext } from '@/frontend/contexts'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { Button } from '@mui/material'
import ClearAllIcon from '@mui/icons-material/ClearAll'


/**
 * End the question
 * @returns 
 */
export default function ClearBuzzerButton({ lang = DEFAULT_LOCALE }) {
    const game = useGameContext()

    const [handleClick, isClearing] = useAsyncAction(async () => {
        await clearBuzzer(game.id, game.currentRound, game.currentQuestion)
    })

    return (
        <Button
            variant='outlined'
            color='warning'
            startIcon={<ClearAllIcon />}
            onClick={handleClick}
            disabled={isClearing}
        >
            {CLEAR_BUZZER_BUTTON_LABEL[lang]}
        </Button>
    )
}

const CLEAR_BUZZER_BUTTON_LABEL = {
    'en': 'Clear buzzer',
    'fr-FR': 'Effacer le buzzer'
}