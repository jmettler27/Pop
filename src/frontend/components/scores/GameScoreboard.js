import { Fragment } from 'react';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { HEAD_RANKING_TEXT, HEAD_SCORE_TEXT, HEAD_TEAM_TEXT } from '@/frontend/components/scores/scoreboardUtils';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

export default function GameScoreboard({ roundScores, teams, lang = DEFAULT_LOCALE }) {
  const gameSortedTeams = roundScores.gameSortedTeams;
  const rankingDiffs = roundScores.rankingDiffs;

  return (
    <TableContainer component={Paper} className="w-2/3">
      <Table size="small" aria-label="round scores table">
        {/* Table head */}
        <TableHead>
          <TableRow>
            <TableCell className="2xl:text-2xl font-bold text-center">{HEAD_RANKING_TEXT[lang]}</TableCell>
            <TableCell className="2xl:text-2xl font-bold">{HEAD_TEAM_TEXT[lang]}</TableCell>
            <TableCell className="2xl:text-2xl font-bold text-center">{HEAD_SCORE_TEXT[lang]}</TableCell>
          </TableRow>
        </TableHead>

        {/* Table body */}
        <TableBody>
          {gameSortedTeams.map((item, idx) => (
            <Fragment key={idx}>
              <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell className="2xl:text-3xl text-center" scope="row" rowSpan={item.teams.length + 1}>
                  {idx + 1}
                </TableCell>
              </TableRow>

              {item.teams.map((teamId) => {
                const teamData = teams.find((team) => team.id === teamId);
                return (
                  <TableRow key={teamId}>
                    <TableCell className="2xl:text-2xl" sx={{ color: teamData.color }}>
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
    </TableContainer>
  );
}

import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import RemoveIcon from '@mui/icons-material/Remove';

import '@/frontend/components/scores/RankDifferenceIcon.css';
import clsx from 'clsx';

function RankDifferenceIcon({ rankDiff }) {
  let icon = null;
  let textContent = null;

  if (rankDiff === 0) {
    icon = <RemoveIcon color="primary" />;
  } else if (rankDiff > 0) {
    icon = <KeyboardArrowUpIcon color="success" fontSize="large" />;
    textContent = rankDiff.toString();
  } else {
    icon = <KeyboardArrowDownIcon color="error" fontSize="large" />;
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
