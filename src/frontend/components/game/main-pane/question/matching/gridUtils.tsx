import clsx from 'clsx';

import { GameMatchingQuestion } from '@/models/questions/matching';

const NODE_RADIUS = 1.5;

export type NodePos = [number, number];
export interface NodeData {
  id: string;
  col: number;
  origRow: number;
  row?: number;
  pos: NodePos;
}

export const getNodeId = (origRow: number, col: number) => `${origRow}_${col}`;

export const getNodeOrigCoords = (id: string) => id.split('_').map(Number);

export const getNode = (id: string, nodePositions: NodeData[][]): NodeData => {
  const [origRow, col] = getNodeOrigCoords(id);
  return nodePositions[col]![origRow]!;
};

export const getNodePosition = (id: string, nodePositions: NodeData[][]): NodePos => getNode(id, nodePositions).pos;

export const getNodeText = (id: string, answer: string[][]): string => {
  const [origRow, col] = getNodeOrigCoords(id);
  return answer[origRow]![col]!;
};

const nodeTextFontSize = (text: string, numCols: number): number => {
  switch (numCols) {
    case 2:
    case 3:
      return text.length <= 25 ? 5 : 4;
    default:
      return 5;
  }
};

// array of numCols*numRows objects { id, col, row, origRow, pos }
export const generateShuffledNodePositions = (numCols: number, numRows: number): NodeData[][] =>
  GameMatchingQuestion.shuffleMatching(numCols, numRows).map((shuffledColumn, col) =>
    shuffledColumn.map(
      (row, origRow): NodeData => ({
        id: `${origRow}_${col}`,
        col,
        origRow,
        row,
        pos: [
          (initPosX(numCols) ?? 0) + (columnSpacing(numCols) ?? 50) * col,
          (initPosY(numRows) ?? 30) + (rowSpacing(numRows) ?? 10) * row,
        ],
      })
    )
  );

export const initPosX = (numCols: number): number => {
  switch (numCols) {
    case 2:
      return 10;
    case 3:
      return -15;
    default:
      return 10;
  }
};

export const initPosY = (numRows: number): number => {
  if (numRows < 8) return 30;
  return 10;
};

export const columnSpacing = (numCols: number): number => {
  switch (numCols) {
    case 2:
      return 50;
    case 3:
      return 85;
    default:
      return 50;
  }
};

export const rowSpacing = (numRows: number): number => {
  switch (numRows) {
    case 5:
    case 6:
    case 7:
    case 8:
      return 10;
    case 9:
    case 10:
      return 9;
    default:
      return 10;
  }
};

export const MatchingNode = ({
  text,
  col,
  pos,
  onClick,
  isActive,
  isMatched,
  numCols,
  isAnswer = false,
}: {
  text: string;
  col: number;
  pos: NodePos;
  onClick: () => void;
  isActive: boolean;
  isMatched: boolean;
  numCols: number;
  isAnswer?: boolean;
}) => {
  const inLastCol = col === numCols - 1;
  return (
    <>
      <circle
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
        x={inLastCol && numCols == 2 ? pos[0] + 4 : pos[0] - 4}
        y={pos[1] + 2}
        textAnchor={inLastCol && numCols == 2 ? 'start' : 'end'}
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
  );
};

export const MatchingEdge = ({
  sourceId,
  targetId,
  nodePositions,
  className,
  onClick = () => {},
}: {
  sourceId: string;
  targetId: string;
  nodePositions: NodeData[][];
  className: string;
  onClick?: () => void;
}) => {
  const sourcePos = getNodePosition(sourceId, nodePositions);
  const targetPos = getNodePosition(targetId, nodePositions);
  if (!sourcePos || !targetPos) {
    console.error('Invalid edge:', { sourcePos, targetPos });
    return null;
  }
  return (
    <line
      className={className}
      x1={sourcePos[0]}
      y1={sourcePos[1]}
      x2={targetPos[0]}
      y2={targetPos[1]}
      onClick={onClick}
    />
  );
};

export const matchIsComplete = (edges: { sourceId: string; targetId: string }[], numCols: number) =>
  edges.length === numCols - 1;
