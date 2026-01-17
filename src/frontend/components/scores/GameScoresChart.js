import { useParams } from 'next/navigation';

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
import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GAME_SCORES_CHART_TITLE = {
  en: 'Global scores',
  'fr-FR': 'Scores globaux',
};

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
  };
};

export default function GameScoresChart({ currentRoundOrder, teams, lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();

  // Return the rounds played up to the current round
  const { roundRepo, scoreRepo } = useGameRepositoriesContext();
  const {
    rounds,
    loading: roundsLoading,
    error: roundsError,
  } = roundRepo.useAllRoundsOnce({
    where: {
      field: 'order',
      operator: '!=',
      value: null,
    },
    orderBy: {
      field: 'order',
      direction: 'asc',
    },
    limit: currentRoundOrder + 1,
  });

  const { gameScores, loading: gameScoresLoading, error: gameScoresError } = scoreRepo.useScoresOnce();

  if (roundsError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundsError)}</strong>
      </p>
    );
  }
  if (gameScoresError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameScoresError)}</strong>
      </p>
    );
  }
  if (roundsLoading || gameScoresLoading) {
    return <CircularProgress />;
  }
  if (!rounds || !gameScores) {
    return <></>;
  }

  const labels = ['', ...rounds.map((round) => round.title)];

  const teamGameScoresSequence = (teamId) => {
    return rounds.map((round) => gameScores.scoresProgress[teamId][round.id]);
  };

  const datasets = teams.map((team) => ({
    id: team.id,
    label: team.name,
    data: [0, ...teamGameScoresSequence(team.id)],
    borderColor: team.color,
    backgroundColor: team.color + '50',
    fill: false,
    tension: 0.1,
  }));

  const data = {
    labels,
    datasets,
  };

  return <Line datasetIdKey={gameId} options={options(lang)} data={data} />;
}
