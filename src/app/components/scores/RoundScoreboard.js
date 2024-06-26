import { Fragment } from 'react'

import { DEFAULT_LOCALE } from '@/lib/utils/locales';
import { rankingToEmoji } from '@/lib/utils/emojis';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { HEAD_RANKING_TEXT, HEAD_REWARD_TEXT, HEAD_SCORE_TEXT, HEAD_TEAM_TEXT } from './scoreboardUtils';

import clsx from 'clsx';

export default function RoundScoreboard({ roundScores, teams, lang = DEFAULT_LOCALE }) {
    const roundSortedTeams = roundScores.roundSortedTeams

    return (
        <TableContainer component={Paper} className='w-2/3'>
            <Table size='small' aria-label='round scores table'>
                {/* Table head */}
                <TableHead>
                    <TableRow>
                        <TableCell className='2xl:text-2xl font-bold text-center'>{HEAD_RANKING_TEXT[lang]}</TableCell>
                        <TableCell className='2xl:text-2xl font-bold'>{HEAD_TEAM_TEXT[lang]}</TableCell>
                        <TableCell className='2xl:text-2xl font-bold text-center'>{HEAD_SCORE_TEXT[lang]}</TableCell>
                        <TableCell className='2xl:text-2xl font-bold text-center'>{HEAD_REWARD_TEXT[lang]}</TableCell>
                    </TableRow>
                </TableHead>

                {/* Table body */}
                <TableBody>
                    {roundSortedTeams.map((item, idx) => (
                        <Fragment key={idx}>
                            <TableRow
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell className='2xl:text-3xl text-center' scope='row' rowSpan={item.teams.length + 1}>
                                    {rankingToEmoji(idx)}
                                </TableCell>
                            </TableRow>

                            {item.teams.map((teamId) => {
                                const teamData = teams.find(team => team.id === teamId)
                                const hasEarnedPoints = item.reward > 0
                                const hasLostPoints = item.reward < 0
                                return (
                                    <TableRow key={teamId}>
                                        <TableCell className='2xl:text-2xl' sx={{ color: teamData.color }}>
                                            {teamData.name}
                                        </TableCell>

                                        <TableCell className='2xl:text-2xl text-center'>
                                            {item.score}
                                        </TableCell>

                                        <TableCell className='2xl:text-2xl text-center font-bold'>
                                            <span className={clsx(
                                                hasEarnedPoints && 'text-green-500',
                                                hasLostPoints && 'text-red-500',
                                            )}>
                                                {hasEarnedPoints && "+"}{item.reward}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}