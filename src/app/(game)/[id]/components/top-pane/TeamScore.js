import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocument, useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { CircularProgress } from '@mui/material'
import { useParams } from 'next/navigation'

export default function TeamScore({ teamId }) {
    const { id: gameId } = useParams()

    const [gameDoc, gameLoading, gameError] = useDocument(doc(GAMES_COLLECTION_REF, gameId))
    if (gameError) {
        return <p><strong>Error:</strong> {JSON.stringify(gameError)}</p>
    }
    if (gameLoading) {
        return <CircularProgress />
    }
    if (!gameDoc) {
        return <></>
    }

    const game = { id: gameId, ...gameDoc.data() }

    if (game.type === 'random') {
        return <TeamGameScore teamId={teamId} />
    } else if (game.type === 'rounds') {
        if (game.roundScorePolicy === 'completion_rate') {
            return <CompletionRatePolicyTeamScore teamId={teamId} game={game} />
        } else {
            return <RankingPolicyTeamScore teamId={teamId} game={game} />
        }
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

function RankingPolicyTeamScore({ teamId, game }) {
    switch (game.status) {
        case 'build':
        case 'game_start':
        case 'game_home':
        case 'game_end':
        case 'special':
        case 'round_start':
        case 'round_end':
            return <TeamGameScore teamId={teamId} />
        default:
            return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />
    }
}

function CompletionRatePolicyTeamScore({ teamId, game }) {
    switch (game.status) {
        case 'build':
        case 'game_start':
        case 'game_home':
        case 'game_end':
        case 'special':
        case 'round_start':
        case 'round_end':
            return <TeamGameScore teamId={teamId} />
        case 'question_active':
        case 'question_end':
            return <CompletionRatePolicyTeamRoundActiveScore teamId={teamId} game={game} />
        default:
            return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />
    }

}

function CompletionRatePolicyTeamRoundActiveScore({ teamId, game }) {
    const [round, roundLoading, roundError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    if (roundError) {
        return <p><strong>Error:</strong> {JSON.stringify(roundError)}</p>
    }
    if (roundLoading) {
        return <CircularProgress />
    }
    if (!round) {
        return <></>
    }

    console.log("Round.twpe", round.type)
    switch (round.type) {
        case 'mixed':
        case 'progressive_clues':
        case 'image':
        case 'emoji':
        case 'blindtest':
        case 'quote':
        case 'enum':
        case 'mcq':
        case 'basic':
            return <TeamRoundScore teamId={teamId} roundId={game.currentRound} />
        case 'odd_one_out':
        case 'matching':
            return <TeamGameScore teamId={teamId} />
        default:
            return <TeamGameScore teamId={teamId} />
    }
}