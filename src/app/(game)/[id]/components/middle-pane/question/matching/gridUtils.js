import clsx from "clsx";

const NODE_RADIUS = 1.5;

export const getNodeId = (origRow, col) =>
    `${origRow}_${col}`;

export const getNodeOrigCoords = (id) =>
    id.split('_').map(Number);

export const getNode = (id, nodePositions) => {
    const [origRow, col] = getNodeOrigCoords(id);
    return nodePositions[col][origRow]
}

export const getNodePosition = (id, nodePositions) =>
    getNode(id, nodePositions).pos;

export const getNodeText = (id, answer) => {
    const [origRow, col] = getNodeOrigCoords(id);
    return answer[origRow.toString()][col]
}

const nodeTextFontSize = (text, numCols) => {
    switch (numCols) {
        case 2:
            return text.length <= 25 ? 5 : 4
        case 3:
            return text.length <= 25 ? 5 : 4
    }
}

import { shuffleMatching } from "@/lib/utils/question/matching";
// array of numCols*numRows objects { id, col, row, origRow, pos }
export const generateShuffledNodePositions = (numCols, numRows) =>
    shuffleMatching(numCols, numRows).map((shuffledColumn, col) =>
        shuffledColumn.map((row, origRow) => ({
            id: `${origRow}_${col}`,
            col,
            origRow,
            row,
            pos: [initPosX(numCols) + columnSpacing(numCols) * col, initPosY(numRows) + rowSpacing(numRows) * row],
        }))
    )

export const initPosX = (numCols) => {
    switch (numCols) {
        case 2:
            return 10
        case 3:
            return -15
    }
}

export const initPosY = (numRows) => {
    if (numRows < 8)
        return 30
    return 10
}


export const columnSpacing = (numCols) => {
    switch (numCols) {
        case 2:
            return 50
        case 3:
            return 85
    }
}

export const rowSpacing = (numRows) => {
    switch (numRows) {
        case 5:
        case 6:
        case 7:
        case 8:
            return 10
        case 9:
        case 10:
            return 9
    }
}

export const MatchingNode = ({ text, col, pos, onClick, isActive, isMatched, numCols, isAnswer = false }) => {
    const inLastCol = col === numCols - 1
    return (
        <>
            <circle
                // id={`MatchingGrid-node-${id}`}
                className={clsx(
                    'MatchingGrid-node',
                    isActive && 'MatchingGrid-node-active',
                    isMatched && 'MatchingGrid-node-correct',
                    isAnswer && 'MatchingGrid-node-answer'
                )}
                onClick={onClick}
                cx={pos[0]}
                cy={pos[1]}
                r={NODE_RADIUS}
            />
            <text
                x={(inLastCol && numCols == 2) ? pos[0] + 4 : pos[0] - 4}
                y={pos[1] + 2}
                textAnchor={(inLastCol && numCols == 2) ? 'start' : 'end'}
                fontSize={nodeTextFontSize(text, numCols)}
                className={clsx(
                    'MatchingGrid-text',
                    isActive && 'MatchingGrid-text-active',
                    isMatched && 'MatchingGrid-text-correct',
                    isAnswer && 'MatchingGrid-text-answer',
                    !isMatched && !isAnswer && 'pointer-events-auto cursor-pointer hover:opacity-50 hover:duration-200'
                )}
                onClick={onClick}
            >
                {text}
            </text>
        </>
    )
}

export const MatchingEdge = ({ sourceId, targetId, nodePositions, className, onClick = () => { } }) => {
    const sourcePos = getNodePosition(sourceId, nodePositions);
    const targetPos = getNodePosition(targetId, nodePositions);
    if (!sourcePos || !targetPos) {
        console.error("Invalid edge:", {
            sourcePos,
            targetPos
        });
        return null;
    }
    return (
        <line className={className}
            x1={sourcePos[0]}
            y1={sourcePos[1]}
            x2={targetPos[0]}
            y2={targetPos[1]}
            onClick={onClick}
        />
    )
}

export const matchIsComplete = (edges, numCols) => edges.length === numCols - 1