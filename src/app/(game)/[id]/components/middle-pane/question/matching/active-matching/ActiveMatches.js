import { useState } from 'react';
import { useGameContext, useRoleContext, useTeamContext } from '@/app/(game)/contexts'

import '@/app/(game)/[id]/components/middle-pane/question/matching/styles.scss';
import LoadingScreen from '@/app/components/LoadingScreen'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { MatchingNode, MatchingEdge, getNode, getNodeText, matchIsComplete } from '@/app/(game)/[id]/components/middle-pane/question/matching/gridUtils';
import SubmitMatchDialog from '@/app/(game)/[id]/components/middle-pane/question/matching/active-matching/SubmitMatchDialog';


export default function ActiveMatches({ answer, nodePositions, numCols }) {
    console.log("ACTIVE MATCHES RENDERED")

    const myRole = useRoleContext()

    const [edges, setEdges] = useState([])
    const [newEdgeSource, setNewEdgeSource] = useState(null);

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

            {(myRole === 'player' || myRole === 'organizer') && (
                <>
                    <UserMatches
                        edges={edges}
                        setEdges={setEdges}
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
    )
}

const nodeIsMatched = (origRow, foundMatches) =>
    foundMatches.find((elem) => elem.matchIdx === origRow);

const nodeIsActive = (id, newEdgeSource, edges) =>
    id === newEdgeSource || edges.find((edge) => edge.from === id || edge.to === id);

const nodeIsDisabled = (origRow, foundMatches, edges, numCols, myRole, isChooser) => {
    if (nodeIsMatched(origRow, foundMatches))
        return true;
    if (matchIsComplete(edges, numCols))
        return true;
    if (myRole === 'organizer')
        return false;
    if (myRole === 'player') {
        return !isChooser;
    }
    return true;
}

function ActiveMatchingQuestionNodes({ answer, nodePositions, numCols, edges, setEdges, newEdgeSource, setNewEdgeSource, deselectOnNewEdge = true }) {
    console.log("ACTIVE MATCHING QUESTION NODES RENDERED")

    const game = useGameContext()
    const myTeam = useTeamContext()
    const myRole = useRoleContext()

    const correctDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'correct')
    const gameStatesDocRef = doc(GAMES_COLLECTION_REF, game.id, 'realtime', 'states')

    const [correctData, correctLoading, correctError] = useDocumentData(correctDocRef)
    const [gameStates, gameStatesLoading, gameStatesError] = useDocumentData(gameStatesDocRef)

    if (correctError) {
        return <p><strong>Error: {JSON.stringify(correctError)}</strong></p>
    }
    if (gameStatesError) {
        return <p><strong>Error: {JSON.stringify(gameStatesError)}</strong></p>
    }
    if (correctLoading || gameStatesLoading) {
        return <LoadingScreen loadingText="Loading..." />
    }
    if (!correctData || !gameStates) {
        return <></>
    }

    const foundMatches = correctData.correctMatches
    const isChooser = gameStates.chooserOrder[gameStates.chooserIdx] === myTeam

    const addNewEdge = (newEdge) => {
        setEdges((edges) => [...edges, newEdge])
    }

    const handleNodeClick = (nodeId) => {
        return (e) => {
            e.preventDefault();
            e.stopPropagation();

            const node = getNode(nodeId, nodePositions)
            if (nodeIsDisabled(node.origRow, foundMatches, edges, numCols, myRole, isChooser)) {
                console.log("Node is disabled")
                return
            }

            // The selected node is the same as the source node => deselect the current node
            if (nodeId === newEdgeSource) {
                console.log("The source node is the same as the selected node")
                if (numCols > 2)
                    return
                setNewEdgeSource(null);
                return
            }

            // The selected node is not the same as the source node
            console.log("The selected node is not the same as the source node")
            const targetNode = node

            // The selected node is the first one in the in-progress match
            if (!newEdgeSource) {
                console.log("The selected node is the first one in the in-progress match")
                // Enforces the user to start from the leftest column
                if (targetNode.col > edges.length)
                    return
                setNewEdgeSource(nodeId);
                return
            }

            // The selected node is not the first one in the in-progress match
            console.log("The selected node is not the first one in the in-progress match")
            const sourceNode = getNode(newEdgeSource, nodePositions)

            // The user has selected a node that is not in the directly adjacent right-hand column
            // if (sourceNode.col === targetNode.col || Math.abs(targetNode.col - sourceNode.col) > 1) {
            if (targetNode.col !== sourceNode.col + 1) {
                console.log("The user has selected a node that is not in the directly adjacent right-hand column")
                return
            }

            // The user has selected a node that is in the directly adjacent right-hand column
            console.log("The user has selected a node that is in the directly adjacent right-hand column")
            addNewEdge({ from: newEdgeSource, to: nodeId });

            // More than two columns
            if (numCols > 2) {
                console.log("More than two columns")
                // The user has already selected all the edges needed to complete the match
                if (matchIsComplete(edges, numCols)) {
                    console.log("The user has already selected all the edges needed to complete the match")
                    return
                }
                console.log("The user has not selected all the edges needed to complete the match")
                setNewEdgeSource(nodeId);
                return
            }

            // Two columns
            console.log("Two columns")
            if (deselectOnNewEdge) {
                setNewEdgeSource(null);
            }
        }
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
    )
}

function UserMatches({ nodePositions, edges, setEdges }) {
    console.log("USER MATCHES RENDERED")

    const removeEdgeByIndex = (edgeIdx) => {
        setEdges([...edges.slice(0, edgeIdx), ...edges.slice(edgeIdx + 1)])
    }

    return edges.map((edge, idx) => (
        <MatchingEdge
            key={`edge_${idx}`}
            className='MatchingGrid-edge'
            sourceId={edge.from}
            targetId={edge.to}
            nodePositions={nodePositions}
            onClick={() => removeEdgeByIndex(idx)}
        />
    ))
}

