'use client';

import { memo } from 'react';

import { buildTeamsBackground, DEFAULT_BACKGROUND } from '@/frontend/helpers/background';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';

// Isolated so team-color updates only repaint the background, not the whole layout
const BackgroundContainer = memo(function BackgroundContainer({}) {
  const repos = useGameRepositories();
  if (!repos) return <div className="absolute inset-0 -z-10" style={{ backgroundImage: DEFAULT_BACKGROUND }} />;
  const { teamRepo } = repos;

  const { teams } = teamRepo.useAllTeams();

  return <div className="absolute inset-0 -z-10" style={{ backgroundImage: buildTeamsBackground(teams) }} />;
});

export default BackgroundContainer;
