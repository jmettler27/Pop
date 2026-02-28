import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const messages = defineMessages('frontend.scores.RoundScoresChart', {
  title: 'Round scores',
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
    // maintainAspectRatio: false,
    // aspectRatio: 1
  };
};

export default function RoundScoresChart({ round, teams, roundScores }) {
  const intl = useIntl();
  const labels = ['', ...round.questions.map((_question, idx) => `Q${idx + 1}`)];

  const datasets = teams.map((team) => ({
    id: team.id,
    label: team.name,
    data: [0, ...roundScores.teamsScoresSequences[team.id]],
    borderColor: team.color,
    backgroundColor: team.color + '50',
    fill: false,
    tension: 0.1,
  }));

  const data = {
    labels,
    datasets,
  };

  return <Line datasetIdKey={round.id} options={options(intl.formatMessage(messages.title))} data={data} />;
}
