import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { useGameRepositoriesContext } from '@/frontend/contexts';

import clsx from 'clsx';

const messages = defineMessages('frontend.game.GameChooserOrder', {
  title: 'Running order',
});

export default function GameChooserOrder({ chooser }) {
  const intl = useIntl();
  const { teamRepo } = useGameRepositoriesContext();
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
        👥 <span className="underline">{intl.formatMessage(messages.title)}</span>
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
