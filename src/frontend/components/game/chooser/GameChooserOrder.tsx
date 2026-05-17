import clsx from 'clsx';
import { useIntl } from 'react-intl';

import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import globalMessages from '@/frontend/i18n/globalMessages';
import Team from '@/models/team';

export default function GameChooserOrder({ chooser }: { chooser: Chooser }) {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo } = gameRepositories;
  const { teams, loading, error } = teamRepo.useAllTeams();

  if (error || loading || !teams) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <h2 className="2xl:text-2xl font-bold">
        👥 <span className="underline">{intl.formatMessage(globalMessages.runningOrder)}</span>
      </h2>

      <ol className="overflow-auto">
        {(chooser.chooserOrder as string[]).map((teamId: string, idx: number) => (
          <li key={idx} className={clsx('xl:text-xl 2xl:text-2xl', idx === chooser.chooserIdx && 'text-focus')}>
            {idx + 1}. {getTeamName(teams, teamId)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function getTeamName(teams: Team[], teamId: string) {
  return teams.find((t) => t.id === teamId)?.name;
}
