import { Fragment } from 'react';

import { ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { useIntl } from 'react-intl';

import { scoreboardMessages } from '@/frontend/components/scores/scoreboardUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/frontend/components/ui/table';

import '@/frontend/components/scores/RankDifferenceIcon.css';

import clsx from 'clsx';

import { RankingDifferences } from '@/models/scores';
import Team from '@/models/team';

interface ScoreboardItem {
  teams: string[];
  score: number;
}

interface RoundScores {
  gameSortedTeams: ScoreboardItem[];
  rankingDiffs?: RankingDifferences;
  [key: string]: unknown;
}

interface GameScoreboardProps {
  roundScores: RoundScores;
  teams: Team[];
}

export default function GameScoreboard({ roundScores, teams }: GameScoreboardProps) {
  const intl = useIntl();
  const gameSortedTeams = roundScores.gameSortedTeams;
  const rankingDiffs = roundScores.rankingDiffs;

  return (
    <div className="w-2/3 rounded-lg border border-border overflow-hidden">
      <Table aria-label="round scores table">
        {/* Table head */}
        <TableHeader>
          <TableRow>
            <TableHead className="2xl:text-2xl font-bold text-center">
              {intl.formatMessage(scoreboardMessages.ranking)}
            </TableHead>
            <TableHead className="2xl:text-2xl font-bold">{intl.formatMessage(scoreboardMessages.team)}</TableHead>
            <TableHead className="2xl:text-2xl font-bold text-center">
              {intl.formatMessage(scoreboardMessages.score)}
            </TableHead>
          </TableRow>
        </TableHeader>

        {/* Table body */}
        <TableBody>
          {gameSortedTeams.map((item, idx) => (
            <Fragment key={idx}>
              <TableRow className="last:*:border-0">
                <TableCell className="2xl:text-3xl text-center" scope="row" rowSpan={item.teams.length + 1}>
                  {idx + 1}
                </TableCell>
              </TableRow>

              {item.teams.map((teamId) => {
                const teamData = teams.find((team) => team.id === teamId);
                if (!teamData) return null;
                return (
                  <TableRow key={teamId}>
                    <TableCell
                      className="text-xs sm:text-sm 2xl:text-base 2xl:text-xl"
                      style={{ color: teamData.color }}
                    >
                      {rankingDiffs && rankingDiffs[teamId] != null && (
                        <RankDifferenceIcon rankDiff={rankingDiffs[teamId]} />
                      )}{' '}
                      {teamData.name}
                    </TableCell>

                    <TableCell className="2xl:text-2xl text-center font-bold">{item.score}</TableCell>
                  </TableRow>
                );
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface RankDifferenceIconProps {
  rankDiff: number;
}

function RankDifferenceIcon({ rankDiff }: RankDifferenceIconProps) {
  let icon = null;
  let textContent = null;

  if (rankDiff === 0) {
    icon = <Minus className="text-primary" />;
  } else if (rankDiff > 0) {
    icon = <ChevronUp className="size-[35px] text-green-500" />;
    textContent = rankDiff.toString();
  } else {
    icon = <ChevronDown className="size-[35px] text-destructive" />;
    textContent = rankDiff.toString();
  }

  return (
    <div className="rank-difference-icon-container">
      {icon}
      {textContent && (
        <div className={clsx(rankDiff > 0 ? 'rank-difference-text-up' : 'rank-difference-text-down')}>
          {textContent}
        </div>
      )}
    </div>
  );
}
