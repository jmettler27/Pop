import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { useAllTeams } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import globalMessages from '@/frontend/i18n/globalMessages';
import { Chooser } from '@/models/chooser';
import Team from '@/models/team';

export default function GameChooserOrder({ chooser }: { chooser: Chooser }) {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  const { teams, loading, error } = useAllTeams(gameRepositories?.teamRepo ?? null);
  if (!gameRepositories) return null;

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
            {getTeamName(teams, teamId)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function getTeamName(teams: Team[], teamId: string) {
  return teams.find((t) => t.id === teamId)?.name;
}
