import { hexToRgba } from '@/frontend/helpers/colors';
import Team from '@/models/team';

const BACKGROUND_BASE = 'white';

export const DEFAULT_BACKGROUND = 'white';

export function buildTeamsBackground(teams: Team[]): string {
  if (teams.length === 0) return DEFAULT_BACKGROUND;

  const blobs = teams.map((team, i) => {
    const angle = (2 * Math.PI * i) / teams.length;
    const x = 50 + 35 * Math.cos(angle);
    const y = 50 + 35 * Math.sin(angle);
    return `radial-gradient(circle at ${x.toFixed(0)}% ${y.toFixed(0)}%, ${hexToRgba(team.color, 0.28)}, transparent 45%)`;
  });

  return [...blobs, BACKGROUND_BASE].join(', ');
}
