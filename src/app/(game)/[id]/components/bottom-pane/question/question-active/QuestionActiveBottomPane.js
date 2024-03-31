import { useGameContext } from '@/app/(game)/contexts'

import RiddleBottomPane from './riddle/RiddleBottomPane'
import QuoteBottomPane from './quote/QuoteBottomPane'
import MatchingBottomPane from './matching/MatchingBottomPane'
import EnumBottomPane from './enum/EnumBottomPane'
import OddOneOutBottomPane from './odd_one_out/OddOneOutBottomPane'
import MCQBottomPane from './mcq/MCQBottomPane'

import LoadingScreen from '@/app/components/LoadingScreen'

import { QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce, useDocumentOnce } from 'react-firebase-hooks/firestore'

export default function QuestionActiveBottomPane({ }) {
    const game = useGameContext();

    const [questionDoc, questionLoading, questionError] = useDocumentOnce(doc(QUESTIONS_COLLECTION_REF, game.currentQuestion))

    if (questionError) {
        return <p><strong>Error: {JSON.stringify(questionError)}</strong></p>
    }
    if (questionLoading) {
        return <LoadingScreen />
    }
    if (!questionDoc) {
        return <></>
    }

    const question = { id: questionDoc.id, ...questionDoc.data() }

    switch (question.type) {
        case 'progressive_clues':
        case 'image':
        case 'blindtest':
        case 'emoji':
            return <RiddleBottomPane question={question} />
        case 'quote':
            return <QuoteBottomPane question={question} />
        case 'enum':
            return <EnumBottomPane question={question} />
        case 'odd_one_out':
            return <OddOneOutBottomPane />
        case 'matching':
            return <MatchingBottomPane />
        case 'mcq':
            return <MCQBottomPane />
    }
}

