import { memo } from 'react'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc, collection, query, where, orderBy } from 'firebase/firestore'
import { useCollectionOnce, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import { Accordion, AccordionSummary, AccordionDetails, Typography, CircularProgress } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import clsx from 'clsx'

import { rankingToEmoji } from '@/lib/utils/emojis'
import { RoundTypeIcon } from '@/lib/utils/question_types'

import LoadingScreen from '@/app/components/LoadingScreen'
import { ROUND_HEADER_TEXT } from '@/lib/utils/round'


export default function GlobalProgressTabPanel({ game }) {
    return (
        <div className='flex flex-col w-full items-center space-y-3'>
            <GameRoundsProgressHeader gameTitle={game.title} />
            <GameRoundsProgress gameId={game.id} />
        </div>
    )
}

const GameRoundsProgressHeader = memo(function GameRoundsProgressHeader({ gameTitle }) {
    return <h1 className='text-xl font-bold mt-1 italic'>{gameTitle}</h1>
});

const GameRoundsProgress = memo(function GameRoundsProgress({ gameId }) {

    const roundsRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds')
    const startedRoundsQuery = query(roundsRef, where('order', '!=', null), orderBy('order', 'asc'))
    const [startedRoundsCollection, startedRoundsLoading, startedRoundsError] = useCollectionOnce(startedRoundsQuery)

    const teamsRef = collection(GAMES_COLLECTION_REF, gameId, 'teams')
    const [teamsCollection, teamsLoading, teamsError] = useCollectionOnce(teamsRef)

    if (startedRoundsError) {
        return <p><strong>Error: {JSON.stringify(startedRoundsError)}</strong></p>
    }
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (startedRoundsLoading || teamsLoading) {
        return <LoadingScreen />
    }
    if (!startedRoundsCollection || !teamsCollection) {
        return <></>
    }
    const startedRounds = startedRoundsCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const teams = teamsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return (
        <div className='w-full mt-4 px-2 space-y-2'>
            {startedRounds.map((round, idx) => (
                <RoundAccordion
                    key={idx}
                    gameId={gameId}
                    round={round}
                    teams={teams}
                    hasEnded={round.dateEnd !== null}
                    isCurrent={idx === startedRounds.length - 1}
                />
            ))}
        </div>
    )
})

function RoundAccordion({ gameId, round, teams, hasEnded, isCurrent, lang = 'fr-FR' }) {
    const roundScoresRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'realtime', 'scores')
    const [roundScores, roundScoresLoading, roundScoresError] = useDocumentDataOnce(roundScoresRef)

    if (roundScoresError) {
        return <p><strong>Error:</strong> {JSON.stringify(roundScoresError)}</p>
    }
    if (roundScoresLoading) {
        return <CircularProgress />
    }
    if (!roundScores) {
        return <></>
    }

    const roundSortedTeams = hasEnded ? roundScores.roundSortedTeams : null
    console.log(round.title, hasEnded, roundSortedTeams)

    const borderColor = (() => {
        if (hasEnded && roundSortedTeams != null && roundSortedTeams.length > 0) {
            const winnerTeams = roundSortedTeams[0].teams
            if (winnerTeams)
                return teams.find((team) => team.id === winnerTeams[0]).color
            return 'inherit'
        }
        if (isCurrent)
            return '#f97316'
    })

    return (
        <Accordion
            key={round.id}
            expanded={true}

            className='rounded-lg'
            elevation={0}
            sx={{
                borderWidth: '0.5px',
                borderStyle: 'solid',
                borderColor: borderColor(),
                backgroundColor: 'inherit',
                color: 'inherit',
            }}
            disableGutters
        >
            <AccordionSummary
                aria-controls="panel1a-content"
                id="panel1a-header"
            >
                <div className='flex flex-row items-center w-full justify-center space-x-1'>
                    <RoundTypeIcon roundType={round.type} fontSize={20} />
                    <Typography className={clsx(
                        (isCurrent && !hasEnded) && 'text-orange-300',
                    )}>
                        <span className='text-xl'><strong>{ROUND_HEADER_TEXT[lang]} {round.order + 1}</strong>: <i>{round.title}</i></span>
                    </Typography>
                </div>
            </AccordionSummary>

            {hasEnded && (
                <AccordionDetails>
                    <ol className='list-inside'>
                        {roundSortedTeams
                            .slice(0, round.rewards.length)
                            .map((item, idx) => {
                                const teamNames = teams.filter((team) => item.teams.includes(team.id)).map((team) => team.name)
                                const teamNamesString = teamNames.slice(0, teamNames.length).join(', ')
                                return (
                                    <li key={idx} className={clsx(idx === 0 && 'font-bold', 'text-lg')}>
                                        {rankingToEmoji(idx)} {teamNamesString} ({item.score} pt{item.score > 1 && 's'})
                                    </li>
                                )
                            })}
                    </ol>
                </AccordionDetails>
            )}
        </Accordion>
    )
}
