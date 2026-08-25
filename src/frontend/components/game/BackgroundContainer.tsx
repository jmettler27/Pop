'use client';

import { memo } from 'react';

import { buildTeamsBackground } from '@/frontend/helpers/background';
import { useAllTeams } from '@/frontend/hooks/firestore/user/useTeamHooks';
import useGameId from '@/frontend/hooks/useGameId';

// Isolated so team-color updates only repaint the background, not the whole layout
const BackgroundContainer = memo(function BackgroundContainer({}) {
  const gameId = useGameId();
  const { teams } = useAllTeams(gameId);

  return <div className="absolute inset-0 -z-10" style={{ backgroundImage: buildTeamsBackground(teams) }} />;
});

export default BackgroundContainer;
