import { endQuestion as endBasicQuestion } from '@/backend/services/question/basic/actions'
import { endQuestion as endBlindtestQuestion } from '@/backend/services/question/blindtest/actions'
import { endQuestion as endEmojiQuestion } from '@/backend/services/question/emoji/actions'
import { endQuestion as endEnumQuestion } from '@/backend/services/question/enumeration/actions'
import { endQuestion as endImageQuestion } from '@/backend/services/question/image/actions'
import { endQuestion as endLabellingQuestion } from '@/backend/services/question/labelling/actions'
import { endQuestion as endMatchingQuestion } from '@/backend/services/question/matching/actions'
import { endQuestion as endMCQQuestion } from '@/backend/services/question/mcq/actions'
import { endQuestion as endNaguiQuestion } from '@/backend/services/question/nagui/actions'
import { endQuestion as endOddOneOutQuestion } from '@/backend/services/question/odd-one-out/actions'
import { endQuestion as endProgressiveCluesQuestion } from '@/backend/services/question/progressive-clues/actions'
import { endQuestion as endQuoteQuestion } from '@/backend/services/question/quote/actions'
import { endQuestion as endReorderingQuestion } from '@/backend/services/question/reordering/actions'

import { useGameContext } from '@/frontend/contexts'
import { QuestionType } from '@/backend/models/questions/QuestionType'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"
import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { Button } from '@mui/material'
import SkipNextIcon from '@mui/icons-material/SkipNext'

/**
 * End the question
 * @param {Object} props
 * @param {string} props.lang - Language code
 * @param {string} props.questionType - Type of question to end
 * @returns 
 */
export default function EndQuestionButton({ lang = DEFAULT_LOCALE, questionType }) {
    const game = useGameContext()

    const getEndAction = () => {
        switch (questionType) {
            case QuestionType.BASIC:
                return endBasicQuestion
            case QuestionType.BLINDTEST:
                return endBlindtestQuestion
            case QuestionType.EMOJI:
                return endEmojiQuestion
            case QuestionType.ENUMERATION:
                return endEnumQuestion
            case QuestionType.IMAGE:
                return endImageQuestion
            case QuestionType.LABELLING:
                return endLabellingQuestion
            case QuestionType.MATCHING:
                return endMatchingQuestion
            case QuestionType.MCQ:
                return endMCQQuestion
            case QuestionType.NAGUI:
                return endNaguiQuestion
            case QuestionType.ODD_ONE_OUT:
                return endOddOneOutQuestion
            case QuestionType.PROGRESSIVE_CLUES:
                return endProgressiveCluesQuestion
            case QuestionType.QUOTE:
                return endQuoteQuestion
            case QuestionType.REORDERING:
                return endReorderingQuestion
            default:
                throw new Error(`Unsupported question type: ${questionType}`)
        }
    }

    const [handleEndQuestion, isEnding] = useAsyncAction(async () => {
        const endAction = getEndAction()
        await endAction(game.id, game.currentRound, game.currentQuestion)
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