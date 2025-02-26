import { useGameContext } from '@/app/(game)/contexts'

import { QUESTIONS_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentOnce } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'

import RiddleMiddlePane from './riddle/RiddleMiddlePane'
import QuoteMiddlePane from './quote/QuoteMiddlePane'
import EnumMiddlePane from './enum/EnumMiddlePane'
import MCQMiddlePane from './mcq/MCQMiddlePane'
import NaguiMiddlePane from './nagui/NaguiMiddlePane'
import OddOneOutMiddlePane from './odd_one_out/OddOneOutMiddlePane'
import MatchingMiddlePane from './matching/MatchingMiddlePane'
import BasicMiddlePane from './basic/BasicMiddlePane'
import LabelMiddlePane from './label/LabelMiddlePane'

export default function QuestionMiddlePane() {
    const game = useGameContext()

    const [questionDoc, questionLoading, questionError] = useDocumentOnce(doc(QUESTIONS_COLLECTION_REF, game.currentQuestion))
    if (questionError) {
        return <p><strong>Error: {JSON.stringify(error)}</strong></p>
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
        case 'emoji':
        case 'blindtest':
            return <RiddleMiddlePane question={question} />
        case 'quote':
            return <QuoteMiddlePane question={question} />
        case 'label':
            return <LabelMiddlePane question={question} />
        case 'enum':
            return <EnumMiddlePane question={question} />
        case 'mcq':
            return <MCQMiddlePane question={question} />
        case 'nagui':
            return <NaguiMiddlePane question={question} />
        case 'odd_one_out':
            return <OddOneOutMiddlePane question={question} />
        case 'matching':
            return <MatchingMiddlePane question={question} />
        case 'basic':
            return <BasicMiddlePane question={question} />
    }
}