import { Fragment } from 'react'

import { DEFAULT_LOCALE } from '@/lib/utils/locales';
import { rankingToEmoji } from '@/lib/utils/emojis';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { HEAD_RANKING_TEXT, HEAD_REWARD_TEXT, HEAD_COMPLETION_RATE_TEXT, HEAD_SCORE_TEXT, HEAD_TEAM_TEXT } from './scoreboardUtils';

import clsx from 'clsx';
import { useGameContext } from '@/app/(game)/contexts';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';

export default function RoundScoreboard({ roundScores, teams, lang = DEFAULT_LOCALE }) {
    const { roundSortedTeams } = roundScores
    const game = useGameContext()

    const [round, roundLoading, roundError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))
    if (roundError) {
        return <p><strong>Error: {JSON.stringify(roundError)}</strong></p>
    }
    if (roundLoading) {
        return <p>Loading round...</p>
    }
    if (!round) {
        return <></>
    }

    const completionRounds = ['progressive_clues', 'image', 'emoji', 'blindtest', 'quote', 'enum', 'mcq', 'basic', 'mixed']
    const isCompletionRound = completionRounds.includes(round.type)

    return (
        <TableContainer component={Paper} className='w-2/3'>
            <Table size='small' aria-label='round scores table'>
                {/* Table head */}
                <TableHead>
                    <TableRow>
                        <TableCell className='2xl:text-2xl font-bold text-center'>{HEAD_RANKING_TEXT[lang]}</TableCell>
                        <TableCell className='2xl:text-2xl font-bold'>{HEAD_TEAM_TEXT[lang]}</TableCell>
                        <TableCell className='2xl:text-2xl font-bold text-center'>{HEAD_SCORE_TEXT[lang]}</TableCell>
                        {game.roundScorePolicy === 'ranking' && <TableCell className='2xl:text-2xl font-bold text-center'>{HEAD_REWARD_TEXT[lang]}</TableCell>}
                        {game.roundScorePolicy === 'completion_rate' && isCompletionRound && <TableCell className='2xl:text-2xl font-bold text-center'>{HEAD_COMPLETION_RATE_TEXT[lang]}</TableCell>}
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
                                            {game.roundScorePolicy === 'ranking' &&
                                                <span className={clsx(
                                                    hasEarnedPoints && 'text-green-500',
                                                    hasLostPoints && 'text-red-500',
                                                )}>
                                                    {hasEarnedPoints && "+"}{item.reward}
                                                </span>
                                            }
                                            {game.roundScorePolicy === 'completion_rate' && isCompletionRound &&
                                                <span>
                                                    {roundScores.roundCompletionRates[teamId]}
                                                </span>
                                            }

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