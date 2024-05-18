import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import { CircularProgress } from '@mui/material'
import { useParams } from 'next/navigation'

export default function TeamScore({ teamId }) {
    const { id: gameId } = useParams()

    const [game, gameLoading, gameError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId))
    if (gameError) {
        return <p><strong>Error:</strong> {JSON.stringify(gameError)}</p>
    }
    if (gameLoading) {
        return <CircularProgress />
    }
    if (!game) {
        return <></>
    }

    if (game.type === 'random') {
        return <TeamGameScore teamId={teamId} />
    }

    switch (game.status) {
        case 'game_start':
        case 'game_home':
        case 'game_end':
        case 'finale':
            return <TeamGameScore teamId={teamId} />
        default:
            return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />
    }
}

function TeamGameScore({ teamId }) {
    const { id: gameId } = useParams()

    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    const [gameScores, gameScoresLoading, gameScoresError] = useDocumentData(gameScoresRef)
    if (gameScoresError) {
        return <p><strong>Error:</strong> {JSON.stringify(gameScoresError)}</p>
    }
    if (gameScoresLoading) {
        return <CircularProgress />
    }
    if (!gameScores) {
        return <></>
    }

    return <span className='2xl:text-3xl'>{(gameScores.scores && Object.keys(gameScores.scores).includes(teamId)) && gameScores.scores[teamId]}</span>
}

function TeamRoundScore({ teamId, roundId }) {
    const { id: gameId } = useParams()

    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', roundId, 'realtime', 'scores')
    const [roundScores, roundScoresLoading, roundScoresError] = useDocumentData(roundScoresRef)
    if (roundScoresError) {
        return <p><strong>Error:</strong> {JSON.stringify(roundScoresError)}</p>
    }
    if (roundScoresLoading) {
        return <CircularProgress />
    }
    if (!roundScores) {
        return <></>
    }

    return <span className='2xl:text-3xl'>{(roundScores.scores && Object.keys(roundScores.scores).includes(teamId)) && roundScores.scores[teamId]}</span>
}