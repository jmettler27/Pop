import { useMemo } from 'react'
import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext, useTeamContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'

import { MCQ_CHOICES } from '@/lib/utils/question/mcq'
import { selectMCQChoice } from '@/app/(game)/lib/question/mcq'
import { generateShuffledIndices } from '@/lib/utils/question/odd_one_out'


import { Avatar, Badge, Button, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { clsx } from 'clsx'

import mcq_correct from '../../../../../../../../public/nagui-correct.png';
import mcq_wrong from '../../../../../../../../public/nagui-wrong.png';

import NoteButton from '@/app/(game)/[id]/components/NoteButton'

export default function MCQMainContent({ question }) {
    const { title, note, choices } = question.details

    // Randomize the order of the choices on the client side
    const randomMapping = useMemo(() =>
        generateShuffledIndices(choices.length),
        [choices.length]
    )

    return (
        <div className='h-full w-full flex flex-col items-center justify-center'>
            <div className='h-[25%] w-full flex flex-row items-center justify-center space-x-1'>
                <h2 className='2xl:text-4xl font-bold'>{title}</h2>
                {note && <NoteButton note={note} />}
            </div>
            <div className='h-[75%] w-full flex items-center justify-center'>
                <MCQMainContentQuestion question={question} randomization={randomMapping} />
            </div>
        </div>
    )
}

import Image from 'next/image'

function MCQAnswerImage({ correct }) {
    if (correct === true) {
        return <Image
            src={mcq_correct.src}
            alt=''
            width={0}
            height={0}
            style={{ width: '100%', height: 'auto' }}
        />
    }
    if (correct === false) {
        return <Image
            src={mcq_wrong.src}
            alt=''
            width={0}
            height={0}
            style={{ width: '80%', height: 'auto' }}
        />
    }
    return <></>
}

function MCQMainContentQuestion({ question, randomization }) {
    const game = useGameContext()

    const questionRealtimeRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(questionRealtimeRef)
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <LoadingScreen loadingText='Loading...' />
    }
    if (!realtime) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full w-full items-center justify-center'>
            <div className='flex flex-col h-full w-1/4 items-center justify-center'>
                <MCQAnswerImage correct={realtime.correct} />
            </div>
            {game.status === 'question_active' && <ActiveMCQChoices question={question} realtime={realtime} randomization={randomization} />}
            {game.status === 'question_end' && <EndedMCQChoices question={question} realtime={realtime} randomization={randomization} />}
            <div className='flex flex-col h-full w-1/4 items-center justify-center'>
                <MCQAnswerImage correct={realtime.correct} />
            </div>
        </div>
    )
}


const choiceIsDisabled = (myRole, isChooser) => !(myRole === 'player' && isChooser)

import { useAsyncAction } from '@/lib/utils/async'


function ActiveMCQChoices({ question, realtime, randomization }) {
    const game = useGameContext()
    const myTeam = useTeamContext()
    const myRole = useRoleContext()
    const user = useUserContext()

    const { choices } = question.details

    const isChooser = myTeam === realtime.teamId

    const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx) => {
        await selectMCQChoice(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, idx)
    })

    return (
        <List className='rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3'>
            {randomization.map((origIdx, idx) => (
                <ListItemButton key={idx}
                    divider={idx !== choices.length - 1}
                    disabled={isSubmitting || choiceIsDisabled(myRole, isChooser)}
                    sx={{
                        '&.Mui-disabled': { opacity: 1 },
                    }}
                    className='border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400'
                    onClick={() => handleSelectChoice(origIdx)}
                >
                    <ListItemText
                        primary={`${MCQ_CHOICES[idx]}. ${question.details.choices[origIdx]}`}
                        primaryTypographyProps={{
                            className: '2xl:text-2xl'
                        }}
                    />
                </ListItemButton>
            ))}
        </List>
    )
}

import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'

function EndedMCQChoices({ question, realtime, randomization }) {
    const { details: { choices, answerIdx } } = question;
    const { choiceIdx, correct, playerId } = realtime;

    const isCorrectAnswer = idx => (idx === answerIdx);
    const isIncorrectChoice = idx => (idx === choiceIdx && idx !== answerIdx);
    const isNeutralChoice = idx => (idx !== choiceIdx && idx !== answerIdx);

    const getBorderColor = idx => {
        if (isCorrectAnswer(idx)) return 'border-green-500';
        if (isIncorrectChoice(idx)) return 'border-red-600';
        if (isNeutralChoice(idx)) return 'border-white border-opacity-35';
    };

    const getTextColor = idx => {
        if (isCorrectAnswer(idx)) return 'text-green-500 font-bold';
        if (isIncorrectChoice(idx)) return 'text-red-600 font-bold';
        if (isNeutralChoice(idx)) return 'text-white opacity-35';
    };

    const getListItemIcon = idx => {
        if (idx === answerIdx && correct === true) {
            return (
                <ListItemIcon>
                    <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={<PlayerAvatar playerId={playerId} />}
                    >
                        <CheckIcon fontSize='medium' color='success' />
                    </Badge>
                </ListItemIcon>
            );
        }

        if (idx === choiceIdx && correct === false) {
            return (
                <ListItemIcon>
                    <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={<PlayerAvatar playerId={playerId} />}
                    >
                        <CloseIcon fontSize='medium' color='error' />
                    </Badge>
                </ListItemIcon>
            );
        }
    };

    return (
        <List className='rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3'>
            {randomization.map((origIdx, idx) => (
                <ListItemButton key={idx}
                    divider={idx !== choices.length - 1}
                    disabled={true}
                    sx={{ '&.Mui-disabled': { opacity: 1 } }}
                    className={clsx('border-4 border-solid rounded-lg', getBorderColor(origIdx))}
                >
                    <ListItemText
                        primary={`${MCQ_CHOICES[idx]}. ${choices[origIdx]}`}
                        primaryTypographyProps={{ className: clsx('2xl:text-2xl', getTextColor(origIdx)) }}
                    />
                    {getListItemIcon(origIdx)}
                </ListItemButton>
            ))}
        </List>
    );
}

function PlayerAvatar({ playerId }) {
    const game = useGameContext()
    const [player, loading, error] = useDocumentDataOnce(doc(GAMES_COLLECTION_REF, game.id, 'players', playerId))
    return !error && !loading && player && (
        <Avatar
            alt={player.name}
            src={player.image}
            sx={{ width: 30, height: 30 }}
        />
    )
}