import { range } from '@/lib/utils/arrays';
import '@/app/(game)/[id]/components/middle-pane/question/matching/styles.scss';

import { MatchingNode, MatchingEdge, getNodeText, getNodeId } from '@/app/(game)/[id]/components/middle-pane/question/matching/gridUtils.js';

export default function EndedMatchingQuestionGrid({ answer, nodePositions, numCols, numRows }) {
    // `answer`: map of `numRows` arrays of `numCols` strings

    return (
        <svg
            viewBox="0 0 100 100"
            width='100%'
            height='100%'
        >
            {/* Draw nodes */}
            {nodePositions.map((column) =>
                column.map(({ id, col, pos }) => (
                    <MatchingNode
                        key={id}
                        col={col}
                        pos={pos}
                        text={getNodeText(id, answer)}
                        onClick={() => { }}
                        isMatched={false}
                        isActive={false}
                        isAnswer={true}
                        numCols={numCols}
                    />
                ))
            )}

            {/* Draw the correct matching edges */}
            {range(numRows).map((row) => (
                range(numCols - 1).map((col) => (
                    <MatchingEdge
                        key={`answer_${row}_${col}`}
                        className='MatchingGrid-edge-answer'
                        sourceId={getNodeId(row, col)}
                        targetId={getNodeId(row, col + 1)}
                        nodePositions={nodePositions}
                    />
                ))
            ))}
        </svg>
    );
}
