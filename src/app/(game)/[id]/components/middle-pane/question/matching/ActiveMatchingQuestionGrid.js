import { range } from '@/lib/utils/arrays';

import ActiveMatches from './active-matching/ActiveMatches';
import CorrectMatches from './active-matching/CorrectMatches';
import IncorrectMatches from './active-matching/IncorrectMatches';
import PartiallyCorrectMatches from './active-matching/PartiallyCorrectMatches';

export default function ActiveMatchingQuestionGrid({ answer, nodePositions, numCols }) {
    console.log("ACTIVE MATCHING GRID RENDERED")

    const colIndices = range(numCols - 1) // [0] or [0, 1]

    return (
        <svg
            viewBox="0 0 100 100"
            width='100%'
            height='100%'
        >
            {/* Draw nodes */}
            {/* Draw user provided edges */}
            <ActiveMatches
                answer={answer}
                nodePositions={nodePositions}
                numCols={numCols}
            />

            {/* Draw the matches that were correctly found by users */}
            <CorrectMatches
                nodePositions={nodePositions}
                colIndices={colIndices}
            />

            {/* Draw the matches that were incorrectly found by users */}
            <IncorrectMatches
                nodePositions={nodePositions}
                colIndices={colIndices}
            />

            {/* Draw the matches that were partially found by users */}
            <PartiallyCorrectMatches
                nodePositions={nodePositions}
            />

        </svg>
    )
}
