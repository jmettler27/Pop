import { useParams } from 'next/navigation';

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
import { useIntl } from 'react-intl';

import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { GameScores } from '@/models/scores';
import Team from '@/models/team';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const messages = defineMessages('frontend.scores.GameScoresChart', {
  title: 'Global scores',
});

export const options = (title: string) => {
  return {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
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

interface GameScoresChartProps {
  currentRoundOrder: number;
  teams: Team[];
}

export default function GameScoresChart({ currentRoundOrder, teams }: GameScoresChartProps) {
  const intl = useIntl();
  const { id } = useParams();
  const gameId = id as string;

  // Return the rounds played up to the current round
  const repos = useGameRepositories();
  if (!repos) return <></>;
  const { roundRepo, scoreRepo } = repos;
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

  if (roundsError || gameScoresError) {
    return <></>;
  }
  if (roundsLoading || gameScoresLoading) {
    return <CircularProgress />;
  }
  if (!rounds || !gameScores) {
    return <></>;
  }

  const labels = ['', ...rounds.map((round) => round.title)];

  const teamGameScoresSequence = (teamId: string) => {
    return rounds.map(
      (round: AnyRound) => (gameScores as unknown as GameScores).scoresProgress[teamId][round.id as string]
    );
  };

  const datasets = teams.map((team: Team) => ({
    id: team.id,
    label: team.name,
    data: [0, ...teamGameScoresSequence(team.id!)],
    borderColor: team.color,
    backgroundColor: team.color + '50',
    fill: false,
    tension: 0.1,
  }));

  const data = {
    labels,
    datasets,
  };

  return <Line datasetIdKey={gameId as string} options={options(intl.formatMessage(messages.title))} data={data} />;
}
