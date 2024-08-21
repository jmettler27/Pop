import { useUserContext } from '@/app/contexts'
import { useGameContext, useRoleContext, useTeamContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData, useDocumentDataOnce } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'

import { MCQ_CHOICES } from '@/lib/utils/question/mcq'
import { selectMCQChoice } from '@/app/(game)/lib/question/mcq'

import { Avatar, Badge, Button, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { clsx } from 'clsx'

import mcq_correct from '../../../../../../../../public/mcq-correct.png';
import mcq_wrong from '../../../../../../../../public/mcq-wrong.png';

import NoteButton from '@/app/(game)/[id]/components/NoteButton'

export default function MCQMainContent({ question }) {
    const { title, note } = question.details
    return (
        <div className='h-full w-full flex flex-col items-center justify-center'>
            <div className='h-[25%] w-full flex flex-row items-center justify-center space-x-1'>
                <h2 className='2xl:text-4xl font-bold'>{title}</h2>
                {note && <NoteButton note={note} />}
            </div>
            <div className='h-[75%] w-full flex items-center justify-center'>
                <MCQMainContentQuestion question={question} />
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

function MCQMainContentQuestion({ question }) {
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
            {game.status === 'question_end' && <MCQAnswerChoices question={question} realtime={realtime} />}
            {game.status === 'question_active' && <MCQChoices question={question} realtime={realtime} />}
            <div className='flex flex-col h-full w-1/4 items-center justify-center'>
                <MCQAnswerImage correct={realtime.correct} />
            </div>
        </div>
    )
}


const choiceIsDisabled = (choiceIdx, myRole, isChooser, subtype, option, duoIdx, answerIdx) => {
    if (!(myRole === 'player' && isChooser))
        return true
    if (subtype === 'immediate')
        return false
    if (option === 'duo')
        return !(choiceIdx === duoIdx || choiceIdx === answerIdx)
    if (option === 'square')
        return false
    return true
}

import { useAsyncAction } from '@/lib/utils/async'


function MCQChoices({ question, realtime }) {
    const game = useGameContext()
    const myTeam = useTeamContext()
    const myRole = useRoleContext()
    const user = useUserContext()

    const { choices, answerIdx, duoIdx, subtype } = question.details

    const isChooser = myTeam === realtime.teamId

    const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx) => {
        await selectMCQChoice(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, idx)
    })

    if (subtype === 'conditional' && (realtime.option === null || realtime.option === 'hide')) {
        // return <Image src={mcq_correct.src} height={'70%'} />
        return <span className='2xl:text-6xl'>{mcqOptionToEmoji('hide')} {mcqOptionToEmoji('square')} {mcqOptionToEmoji('duo')} ?</span>
    }


    return (
        <List className='rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3'>
            {choices.map((choice, idx) => (
                // If the question is a duo question, only show the duoIdx and answerIdx
                (subtype === 'immediate' ||
                    (subtype === 'conditional' && (realtime.option !== 'duo' || (idx === answerIdx || idx === duoIdx)))
                ) && (
                    <ListItemButton key={idx}
                        divider={idx !== choices.length - 1}
                        disabled={isSubmitting || choiceIsDisabled(idx, myRole, isChooser, subtype, realtime.option, duoIdx, answerIdx)}
                        sx={{
                            '&.Mui-disabled': { opacity: 1 },
                        }}
                        className='border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400'
                        onClick={() => handleSelectChoice(idx)}
                    >
                        <ListItemText
                            primary={`${MCQ_CHOICES[idx]}. ${choice}`}
                            primaryTypographyProps={{
                                className: '2xl:text-2xl'
                            }}
                        />
                    </ListItemButton>
                )
            ))}
        </List>
    )
}

import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { mcqOptionToEmoji } from '@/lib/utils/question/mcq'

function MCQAnswerChoices({ question, realtime }) {
    const isCorrectAnswer = idx => ((realtime.option === 'hide' && realtime.correct && idx === question.details.answerIdx) || idx === question.details.answerIdx);
    const isIncorrectChoice = idx => (realtime.option === 'duo' || realtime.option === 'square') && idx === realtime.choiceIdx && idx !== question.details.answerIdx;
    const isNeutralChoice = idx => ((realtime.option === 'hide' && realtime.correct && idx !== question.details.answerIdx) || (idx !== realtime.choiceIdx && idx !== question.details.answerIdx));

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
        if (realtime.correct && idx === question.details.answerIdx) {
            return (
                <ListItemIcon>
                    <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={<PlayerAvatar playerId={realtime.playerId} />}
                    >
                        <CheckIcon fontSize='medium' color='success' />
                    </Badge>
                </ListItemIcon>
            );
        }

        if (realtime.option !== 'hide' && realtime.correct === false && idx === realtime.choiceIdx) {
            return (
                <ListItemIcon>
                    <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={<PlayerAvatar playerId={realtime.playerId} />}
                    >
                        <CloseIcon fontSize='medium' color='error' />
                    </Badge>
                </ListItemIcon>
            );
        }
    };

    return (
        <List className='rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3'>
            {question.details.choices.map((choice, idx) => (
                <ListItemButton key={idx}
                    divider={idx !== question.details.choices.length - 1}
                    disabled={true}
                    sx={{ '&.Mui-disabled': { opacity: 1 } }}
                    className={clsx('border-4 border-solid rounded-lg', getBorderColor(idx))}
                >
                    <ListItemText
                        primary={`${MCQ_CHOICES[idx]}. ${choice}`}
                        primaryTypographyProps={{ className: clsx('2xl:text-2xl', getTextColor(idx)) }}
                    />
                    {getListItemIcon(idx)}
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