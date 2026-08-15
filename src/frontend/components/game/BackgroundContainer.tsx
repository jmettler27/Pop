'use client';

import { memo } from 'react';

import { buildTeamsBackground, DEFAULT_BACKGROUND } from '@/frontend/helpers/background';
import { useAllTeams } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGame from '@/frontend/hooks/useGame';

// Isolated so team-color updates only repaint the background, not the whole layout
const BackgroundContainer = memo(function BackgroundContainer({}) {
  const game = useGame();
  const { teams } = useAllTeams(game?.id ?? null);
  if (!game) return <div className="absolute inset-0 -z-10" style={{ backgroundImage: DEFAULT_BACKGROUND }} />;

  return <div className="absolute inset-0 -z-10" style={{ backgroundImage: buildTeamsBackground(teams) }} />;
});

export default BackgroundContainer;
