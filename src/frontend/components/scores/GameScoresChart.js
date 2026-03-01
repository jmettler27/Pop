import { useParams } from 'next/navigation';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { CircularProgress } from '@mui/material';

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useGameRepositoriesContext } from '@/frontend/contexts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const messages = defineMessages('frontend.scores.GameScoresChart', {
  title: 'Global scores',
});

export const options = (title) => {
  return {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
};

export default function GameScoresChart({ currentRoundOrder, teams }) {
  const intl = useIntl();
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

  return <Line datasetIdKey={gameId} options={options(intl.formatMessage(messages.title))} data={data} />;
}
