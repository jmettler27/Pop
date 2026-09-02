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

import { Spinner } from '@/components/ui/spinner';
import { useAllRoundsOnce } from '@/hooks/firestore/round/useRoundHooks';
import { useScoresOnce } from '@/hooks/firestore/score/useGameScoreHooks';
import useGameId from '@/hooks/useGameId';
import defineMessages from '@/i18n/defineMessages';
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
  const gameId = useGameId();

  // Return the rounds played up to the current round
  const {
    rounds,
    loading: roundsLoading,
    error: roundsError,
  } = useAllRoundsOnce(gameId, {
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

  const { gameScores, loading: gameScoresLoading, error: gameScoresError } = useScoresOnce(gameId);

  if (roundsError || gameScoresError) {
    return <></>;
  }
  if (roundsLoading || gameScoresLoading) {
    return <Spinner />;
  }
  if (!rounds || !gameScores) {
    return <></>;
  }

  const labels = ['', ...rounds.map((round) => round.title)];

  const teamGameScoresSequence = (teamId: string) => {
    const teamProgress = (gameScores as unknown as GameScores).scoresProgress[teamId] ?? {};
    return rounds.map((round: AnyRound) => teamProgress[round.id as string]);
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
