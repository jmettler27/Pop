import { clearBuzzer as clearBlindtestBuzzer } from '@/backend/services/question/blindtest/actions'
import { clearBuzzer as clearEmojiBuzzer } from '@/backend/services/question/emoji/actions'
import { clearBuzzer as clearImageBuzzer } from '@/backend/services/question/image/actions'
import { clearBuzzer as clearProgressiveCluesBuzzer } from '@/backend/services/question/progressive-clues/actions'

import { QuestionType } from '@/backend/models/questions/QuestionType'


import { useGameContext } from '@/frontend/contexts'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { Button } from '@mui/material'
import ClearAllIcon from '@mui/icons-material/ClearAll'


/**
 * Clear the question buzzer
 * @param {Object} props
 * @param {string} props.lang - Language code
 * @param {string} props.questionType - Type of question to clear the buzzer
 * @returns 
 */
export default function ClearBuzzerButton({ lang = DEFAULT_LOCALE, questionType }) {
    const game = useGameContext()

    const getClearBuzzerAction = () => {
        switch (questionType) {
            case QuestionType.BLINDTEST:
                return clearBlindtestBuzzer
            case QuestionType.EMOJI:
                return clearEmojiBuzzer
            case QuestionType.IMAGE:
                return clearImageBuzzer
            case QuestionType.PROGRESSIVE_CLUES:
                return clearProgressiveCluesBuzzer
        }

        throw new Error(`Unsupported question type: ${questionType}`)
    }

    const [handleClick, isClearing] = useAsyncAction(async () => {
        const clearBuzzerAction = getClearBuzzerAction()
        await clearBuzzerAction(game.id, game.currentRound, game.currentQuestion)
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