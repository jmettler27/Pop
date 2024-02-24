import { useParams } from 'next/navigation';

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { collection, doc, query, orderBy, limit, where } from 'firebase/firestore';
import { useCollectionOnce, useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { CircularProgress } from '@mui/material';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const GAME_SCORES_CHART_TITLE = {
    'en': "Global scores",
    'fr-FR': "Scores globaux"
}

export const options = (lang) => {
    return {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: GAME_SCORES_CHART_TITLE[lang],
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    }
}


export default function GameScoresChart({ currentRoundOrder, teams, lang = 'en' }) {
    const { id: gameId } = useParams()

    const roundsCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds')
    // Return the rounds played up to the current round
    const roundsQuery = query(roundsCollectionRef, where('order', '!=', null), orderBy('order', 'asc'), limit(currentRoundOrder + 1))
    const [roundsCollection, roundsLoading, roundsError] = useCollectionOnce(roundsQuery)

    const gameScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'scores')
    const [gameScores, gameScoresLoading, gameScoresError] = useDocumentDataOnce(gameScoresRef)

    if (roundsError) {
        return <p><strong>Error: {JSON.stringify(roundsError)}</strong></p>
    }
    if (gameScoresError) {
        return <p><strong>Error: {JSON.stringify(gameScoresError)}</strong></p>
    }
    if (roundsLoading || gameScoresLoading) {
        return <CircularProgress />
    }
    if (!roundsCollection || !gameScores) {
        return <></>
    }
    const rounds = roundsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    const labels = ["", ...rounds.map((round) => round.title)]

    const teamGameScoresSequence = (teamId) => {
        return rounds.map((round) => gameScores.scoresProgress[teamId][round.id])
    }

    const datasets = teams.map((team) => ({
        id: team.id,
        label: team.name,
        data: [0, ...teamGameScoresSequence(team.id)],
        borderColor: team.color,
        backgroundColor: team.color + '50',
        fill: false,
        tension: 0.1
    }))

    const data = {
        labels,
        datasets,
    };

    return <Line datasetIdKey={gameId} options={options(lang)} data={data} />;
}