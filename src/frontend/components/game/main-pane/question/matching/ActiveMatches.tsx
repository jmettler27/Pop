import { ParticipantRole } from '@/models/users/participant';

import '@/frontend/components/game/main-pane/question/matching/styles.scss';

import { useState } from 'react';

import { CircularProgress } from '@mui/material';

import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import { isObjectEmpty } from '@/backend/utils/objects';
import {
  getNode,
  getNodeText,
  MatchingEdge,
  MatchingNode,
  matchIsComplete,
  type NodeData,
} from '@/frontend/components/game/main-pane/question/matching/gridUtils';
import SubmitMatchDialog from '@/frontend/components/game/main-pane/question/matching/SubmitMatchDialog';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import { GameRounds } from '@/models/games/game';
import { MatchingAnswer, MatchingEdgeData } from '@/models/questions/matching';

interface ActiveMatchesProps {
  answer: MatchingAnswer;
  nodePositions: NodeData[][];
  numCols: number;
}

export default function ActiveMatches({ answer, nodePositions, numCols }: ActiveMatchesProps) {
  const myRole = useRole();

  const [edges, setEdges] = useState<MatchingEdgeData[]>([]);
  const [newEdgeSource, setNewEdgeSource] = useState<string | null>(null);

  return (
    <>
      <ActiveMatchingQuestionNodes
        answer={answer}
        nodePositions={nodePositions}
        numCols={numCols}
        edges={edges}
        setEdges={setEdges}
        newEdgeSource={newEdgeSource}
        setNewEdgeSource={setNewEdgeSource}
      />

      {(myRole === ParticipantRole.PLAYER || myRole === ParticipantRole.ORGANIZER) && (
        <>
          <UserMatches
            edges={edges}
            setEdges={setEdges}
            setNewEdgeSource={setNewEdgeSource}
            nodePositions={nodePositions}
          />

          <SubmitMatchDialog
            edges={edges}
            setEdges={setEdges}
            numCols={numCols}
            setNewEdgeSource={setNewEdgeSource}
            answer={answer}
          />
        </>
      )}
    </>
  );
}

type FoundMatch = { matchIdx: number };

const nodeIsMatched = (origRow: number, foundMatches: FoundMatch[]) =>
  !isObjectEmpty(foundMatches as unknown as Record<string, unknown>) &&
  !!foundMatches.find((elem) => elem.matchIdx === origRow);

const nodeIsActive = (id: string, newEdgeSource: string | null, edges: MatchingEdgeData[]) =>
  id === newEdgeSource || !!edges.find((edge) => edge.from === id || edge.to === id);

const nodeIsDisabled = (
  origRow: number,
  foundMatches: FoundMatch[],
  edges: MatchingEdgeData[],
  numCols: number,
  myRole: ParticipantRole,
  isChooser: boolean,
  isCanceled: boolean
) => {
  if (nodeIsMatched(origRow, foundMatches)) return true;
  if (
    matchIsComplete(
      edges.map((e) => ({ sourceId: e.from, targetId: e.to })),
      numCols
    )
  )
    return true;
  if (myRole === ParticipantRole.ORGANIZER) return false;
  if (myRole === ParticipantRole.PLAYER) {
    return isCanceled || !isChooser;
  }
  return true;
};

interface ActiveMatchingQuestionNodesProps {
  answer: MatchingAnswer;
  nodePositions: NodeData[][];
  numCols: number;
  edges: MatchingEdgeData[];
  setEdges: React.Dispatch<React.SetStateAction<MatchingEdgeData[]>>;
  newEdgeSource: string | null;
  setNewEdgeSource: React.Dispatch<React.SetStateAction<string | null>>;
  deselectOnNewEdge?: boolean;
}

function ActiveMatchingQuestionNodes({
  answer,
  nodePositions,
  numCols,
  edges,
  setEdges,
  newEdgeSource,
  setNewEdgeSource,
  deselectOnNewEdge = true,
}: ActiveMatchingQuestionNodesProps) {
  const game = useGame();
  if (!game) return null;

  const myTeam = useTeam();
  const myRole = useRole();

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { chooserRepo } = gameRepositories;

  const { isChooser, loading: isChooserLoading, error: isChooserError } = chooserRepo.useIsChooser(myTeam as string);

  const gameQuestionRepo = new GameMatchingQuestionRepository(game.id as string, game.currentRound as string);
  const {
    isCanceled,
    loading: isCanceledLoading,
    error: isCanceledError,
  } = gameQuestionRepo.useIsCanceled(game.currentQuestion as string, myTeam as string);
  const {
    correctMatches,
    loading: correctMatchesLoading,
    error: correctMatchesError,
  } = gameQuestionRepo.useCorrectMatches(game.currentQuestion as string);

  if (isChooserError || isCanceledError || correctMatchesError) return <></>;
  if (isChooserLoading || isCanceledLoading || correctMatchesLoading) return <CircularProgress />;
  if (!correctMatches) return <></>;

  const foundMatches = (correctMatches as FoundMatch[]) ?? [];

  const edgesAsSourceTarget = edges.map((e) => ({ sourceId: e.from, targetId: e.to }));

  const addNewEdge = (newEdge: MatchingEdgeData) => {
    setEdges((prev) => [...prev, newEdge]);
  };

  const handleNodeClick = (nodeId: string) => {
    return () => {
      const node = getNode(nodeId, nodePositions);
      if (
        nodeIsDisabled(
          node.origRow,
          foundMatches,
          edges,
          numCols,
          myRole ?? ParticipantRole.SPECTATOR,
          isChooser,
          isCanceled
        )
      )
        return;

      if (nodeId === newEdgeSource) {
        if (numCols > 2) return;
        setNewEdgeSource(null);
        return;
      }

      const targetNode = node;

      if (!newEdgeSource) {
        if (targetNode.col > edges.length) return;
        setNewEdgeSource(nodeId);
        return;
      }

      const sourceNode = getNode(newEdgeSource, nodePositions);

      if (targetNode.col === sourceNode.col) {
        setNewEdgeSource(targetNode.id);
        if (edges.length > 0) {
          const lastEdge = edges[edges.length - 1]!;
          setEdges((prev) => prev.slice(0, -1));
          addNewEdge({ from: lastEdge.from, to: targetNode.id });
        }
      }

      if (targetNode.col !== sourceNode.col + 1) return;

      addNewEdge({ from: newEdgeSource, to: nodeId });

      if (numCols > 2) {
        if (matchIsComplete(edgesAsSourceTarget, numCols)) return;
        setNewEdgeSource(nodeId);
        return;
      }

      if (deselectOnNewEdge) {
        setNewEdgeSource(null);
      }
    };
  };

  return nodePositions.map((column) =>
    column.map(({ id, col, origRow, pos }) => (
      <MatchingNode
        key={id}
        col={col}
        pos={pos}
        text={getNodeText(id, answer)}
        onClick={handleNodeClick(id)}
        isMatched={nodeIsMatched(origRow, foundMatches)}
        isActive={nodeIsActive(id, newEdgeSource, edges)}
        numCols={numCols}
      />
    ))
  );
}

interface UserMatchesProps {
  nodePositions: NodeData[][];
  edges: MatchingEdgeData[];
  setEdges: React.Dispatch<React.SetStateAction<MatchingEdgeData[]>>;
  setNewEdgeSource: React.Dispatch<React.SetStateAction<string | null>>;
}

function UserMatches({ nodePositions, edges, setEdges, setNewEdgeSource }: UserMatchesProps) {
  const handleClickEdge = (edgeIdx: number) => {
    if (edgeIdx === edges.length - 1) {
      const lastEdge = edges[edges.length - 1]!;
      setNewEdgeSource(lastEdge.from);
      setEdges((prev) => prev.slice(0, -1));
    }
  };

  return edges.map((edge, idx) => (
    <MatchingEdge
      key={`edge_${idx}`}
      className="MatchingGrid-edge"
      sourceId={edge.from}
      targetId={edge.to}
      nodePositions={nodePositions}
      onClick={() => handleClickEdge(idx)}
    />
  ));
}
