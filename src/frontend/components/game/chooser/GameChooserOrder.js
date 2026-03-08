import { useIntl } from 'react-intl';
import globalMessages from '@/i18n/globalMessages';

import useGameRepositories from '@/frontend/hooks/useGameRepositories';

import clsx from 'clsx';

export default function GameChooserOrder({ chooser }) {
  const intl = useIntl();
  const { teamRepo } = useGameRepositories();
  const { teams, loading, error } = teamRepo.useAllTeams();

  if (error) {
    return (
      <p>
        <strong>Error: {JSON.stringify(error)}</strong>
      </p>
    );
  }
  if (loading) {
    return <></>;
  }
  if (!teams) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <h2 className="2xl:text-2xl font-bold">
        👥 <span className="underline">{intl.formatMessage(globalMessages.runningOrder)}</span>
      </h2>

      <ol className="overflow-auto">
        {chooser.chooserOrder.map((teamId, idx) => (
          <li key={idx} className={clsx('xl:text-xl 2xl:text-2xl', idx === chooser.chooserIdx && 'text-focus')}>
            {idx + 1}. {getTeamName(teams, teamId)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function getTeamName(teams, teamId) {
  return teams.find((t) => t.id === teamId).name;
}
