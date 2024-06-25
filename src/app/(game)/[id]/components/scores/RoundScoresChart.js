import { DEFAULT_LOCALE } from '@/lib/utils/locales';
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

const ROUND_SCORES_CHART_TITLE = {
    'en': "Round scores",
    'fr-FR': "Scores de la manche"
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
                text: ROUND_SCORES_CHART_TITLE[lang],
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
        // maintainAspectRatio: false,
        // aspectRatio: 1
    }
};


export default function RoundScoresChart({ round, teams, roundScores, lang = DEFAULT_LOCALE }) {
    const labels = ["", ...round.questions.map((_question, idx) => `Q${idx + 1}`)]

    const datasets = teams.map((team) => ({
        id: team.id,
        label: team.name,
        data: [0, ...roundScores.teamsScoresSequences[team.id]],
        borderColor: team.color,
        backgroundColor: team.color + '50',
        fill: false,
        tension: 0.1
    }))

    const data = {
        labels,
        datasets,
    }

    return <Line datasetIdKey={round.id} options={options(lang)} data={data} />
}