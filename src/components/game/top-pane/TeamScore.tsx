import { memo } from 'react';

import { Spinner } from '@/components/ui/spinner';

interface TeamScoreProps {
  teamId: string;
  scores: Record<string, unknown> | undefined;
  loading: boolean;
}
// Purely presentational: which score map applies (game-level vs. round-level, by policy and status) is
// resolved once for every team by useCurrentTeamScores and passed down — this just looks up its own
// teamId in the result, instead of every team independently re-deriving the policy and re-fetching.
const TeamScore = memo(function TeamScore({ teamId, scores, loading }: TeamScoreProps) {
  if (loading) return <Spinner />;
  if (!scores || !(teamId in scores)) return <></>;
  return <span className="2xl:text-3xl">{String(scores[teamId])}</span>;
});

export default TeamScore;
