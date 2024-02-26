import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import PropTypes from 'prop-types'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import ValidateChallengerCitationButton from './ValidateChallengerCitationButton'

export default function ChallengerCitationHelper({ }) {
    const game = useGameContext()

    const playersDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'players')
    const [players, playersLoading, playersError] = useDocumentData(playersDocRef)
    if (playersError) {
        return <p><strong>Error: </strong>{JSON.stringify(playersError)}</p>
    }
    if (playersLoading) {
        return <></>
    }
    if (!players) {
        return <></>
    }

    const { challenger } = players

    return (
        <div className='flex flex-col w-full items-center justify-center'>
            <ChallengerName challengerId={challenger.playerId} />
            <ChallengerProgress challenger={challenger} />
        </div>
    )
}

function ChallengerName({ challengerId }) {
    const { id: gameId } = useParams()

    const [challengerData, challengerDataLoading, challengerDataError] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, gameId, 'players', challengerId))
    if (challengerDataError) {
        return <p><strong>Error: {JSON.stringify(challengerDataError)}</strong></p>
    }
    if (challengerDataLoading) {
        return <></>
    }
    if (!challengerData) {
        return <></>
    }

    return <span className='text-3xl font-bold'>{challengerData.name}</span>
}

const progressToSmiley = {
    0: '😐',   // Neutral
    10: '🙂',  // Slightly Smiling
    20: '😄',  // Happy
    30: '😀',  // Grinning
    40: '😁',  // Beaming
    50: '😃',  // Grinning with Big Eyes
    60: '😄',  // Grinning with Smiling Eyes
    70: '😆',  // Grinning with Squinting Eyes
    80: '🤩',  // Smiling with Heart Eyes
    90: '😍',  // Excited
    100: '🥳', // Super Excited
}

const progressToBarColor = {
    0: '#FF0000',    // Red - 0%
    10: '#FF3300',
    20: '#FF6600',
    30: '#FF9900',
    40: '#FFCC00',
    50: '#FFFF00',   // Yellow - 50%
    60: '#CCFF00',
    70: '#99FF00',
    80: '#66FF00',
    90: '#33FF00',
    100: '#00FF00',  // Green - 100%
};

import clsx from 'clsx'

function ChallengerProgress({ challenger }) {
    const myRole = useRoleContext()

    const percentage = (challenger.numCorrect * 100) / challenger.bet;
    const cappedPercentage = Math.min(percentage, 100);
    const roundedDownToNearestTen = Math.floor(cappedPercentage / 10) * 10;

    return (
        <Box className='flex flex-row w-full items-center justify-center space-x-4'>

            <Typography variant='h5'>{progressToSmiley[roundedDownToNearestTen]}</Typography>

            <LinearProgress
                className='w-1/2 h-3'
                sx={{
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: progressToBarColor[roundedDownToNearestTen]
                    }
                }}
                variant='determinate'
                value={cappedPercentage}
            />

            <Typography variant='h5' className={clsx((challenger.numCorrect >= challenger.bet) && 'text-green-500',)}>
                {challenger.numCorrect}/<strong>{challenger.bet}</strong>
            </Typography>

            {myRole === 'organizer' && <ValidateChallengerCitationButton />}

        </Box>
    )

}

