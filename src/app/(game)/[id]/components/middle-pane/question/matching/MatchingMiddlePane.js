import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'

export default function MatchingMiddlePane({ question }) {

    return (
        <div className='flex flex-col h-full items-center'>
            <div className='h-[10%] flex flex-col items-center justify-center'>
                <MatchingQuestionHeader question={question} />
            </div>
            <div className='h-[90%] w-full flex flex-col items-center justify-center'>
                <MatchingQuestionGrid question={question} />
            </div>
        </div>
    )
}


function MatchingQuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center space-x-1'>
            <QuestionTypeIcon questionType={question.type} fontSize={50} />
            <h1 className='xl:text-3xl 2xl:text-5xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong>: {question.details.title}</h1>
        </div>
    )
}


import { useGameContext } from '@/app/(game)/contexts'
import { useMemo } from 'react';
import { generateShuffledNodePositions } from '@/app/(game)/[id]/components/middle-pane/question/matching/gridUtils.js';

import ActiveMatchingQuestionGrid from './ActiveMatchingQuestionGrid';
import EndedMatchingQuestionGrid from './EndedMatchingQuestionGrid';

function MatchingQuestionGrid({ question }) {
    const game = useGameContext()

    const { answer, numCols, numRows } = question.details

    const nodePositions = useMemo(() =>
        generateShuffledNodePositions(numCols, numRows),
        [numCols, numRows]
    )

    return <>
        {game.status === 'question_active' && <ActiveMatchingQuestionGrid answer={answer} nodePositions={nodePositions} numCols={numCols} />}
        {game.status === 'question_end' && <EndedMatchingQuestionGrid answer={answer} nodePositions={nodePositions} numCols={numCols} numRows={numRows} />}
    </>
}