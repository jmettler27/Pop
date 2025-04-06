import { useGameContext } from '@/frontend/contexts'

import LoadingScreen from '@/frontend/components/LoadingScreen'

import BasicMiddlePane from '@/frontend/components/game/middle-pane/question/basic/BasicMiddlePane'
import EnumerationMiddlePane from '@/frontend/components/game/middle-pane/question/enumeration/EnumerationMiddlePane'
import LabellingMiddlePane from '@/frontend/components/game/middle-pane/question/labelling/LabellingMiddlePane'
import MatchingMiddlePane from '@/frontend/components/game/middle-pane/question/matching/MatchingMiddlePane'
import MCQMiddlePane from '@/frontend/components/game/middle-pane/question/mcq/MCQMiddlePane'
import NaguiMiddlePane from '@/frontend/components/game/middle-pane/question/nagui/NaguiMiddlePane'
import OddOneOutMiddlePane from '@/frontend/components/game/middle-pane/question/odd_one_out/OddOneOutMiddlePane'
import QuoteMiddlePane from '@/frontend/components/game/middle-pane/question/quote/QuoteMiddlePane'
import RiddleMiddlePane from '@/frontend/components/game/middle-pane/question/riddle/RiddleMiddlePane'

import { QuestionType } from '@/backend/models/questions/QuestionType'
import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository'

export default function QuestionMiddlePane() {
    const game = useGameContext()

    const baseQuestionRepo = new BaseQuestionRepository()
    const { baseQuestion, baseQuestionLoading, baseQuestionError } = baseQuestionRepo.useQuestionOnce(game.currentQuestion)

    if (baseQuestionError) {
        return <p><strong>Error: {JSON.stringify(baseQuestionError)}</strong></p>
    }
    if (baseQuestionLoading) {
        return <LoadingScreen />
    }
    if (!baseQuestion) {
        return <></>
    }

    switch (baseQuestion.type) {
        case QuestionType.BASIC:
            return <BasicMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.BLINDTEST:
        case QuestionType.EMOJI:
        case QuestionType.IMAGE:
        case QuestionType.PROGRESSIVE_CLUES:
            return <RiddleMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.ENUMERATION:
            return <EnumerationMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.LABELLING:
            return <LabellingMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.MATCHING:
            return <MatchingMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.MCQ:
            return <MCQMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.NAGUI:
            return <NaguiMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.ODD_ONE_OUT:
            return <OddOneOutMiddlePane baseQuestion={baseQuestion} />
        case QuestionType.QUOTE:
            return <QuoteMiddlePane baseQuestion={baseQuestion} />

    }
}