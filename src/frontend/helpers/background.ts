import { hexToRgba } from '@/frontend/helpers/colors';
import Team from '@/models/team';

const BACKGROUND_BASE = 'linear-gradient(to bottom, #1e293b, #0f172a)';

export const DEFAULT_BACKGROUND = [
  'radial-gradient(circle at 25% 15%, rgba(59, 130, 246, 0.3), transparent 45%)',
  'radial-gradient(circle at 85% 80%, rgba(99, 102, 241, 0.22), transparent 50%)',
  'radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.2), transparent 50%)',
  BACKGROUND_BASE,
].join(', ');

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
