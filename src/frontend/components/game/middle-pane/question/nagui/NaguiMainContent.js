import { selectNaguiChoice } from '@/backend/services/question/nagui/actions_old'

import RoundNaguiQuestionRepository from '@/backend/repositories/question/game/GameNaguiQuestionRepository'

import { NaguiQuestion, HideNaguiOption, SquareNaguiOption, DuoNaguiOption } from '@/backend/models/questions/Nagui'
import { GameStatus } from '@/backend/models/games/GameStatus'
import { UserRole } from '@/backend/models/users/User'

import { shuffleIndices } from '@/backend/utils/arrays'

import { useUserContext, useGameContext, useRoleContext, useTeamContext, useGameRepositoriesContext } from '@/frontend/contexts'

import LoadingScreen from '@/frontend/components/LoadingScreen'
import NoteButton from '@/frontend/components/game/NoteButton'

import { IMAGES } from '@/frontend/constants/images'

import { useMemo } from 'react'


import { Avatar, Badge, Button, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'

import { clsx } from 'clsx'


export default function NaguiMainContent({ baseQuestion }) {
    const title = baseQuestion.title
    const note = baseQuestion.note
    const choices = baseQuestion.items

    // Randomize the order of the choices on the client side
    const randomMapping = useMemo(() =>
        shuffleIndices(choices.length),
        [choices.length]
    )

    return (
        <div className='h-full w-full flex flex-col items-center justify-center'>
            <div className='h-[25%] w-full flex flex-row items-center justify-center space-x-1'>
                <h2 className='2xl:text-4xl font-bold'>{title}</h2>
                {note && <NoteButton note={note} />}
            </div>
            <div className='h-[75%] w-full flex items-center justify-center'>
                <NaguiMainContentQuestion baseQuestion={baseQuestion} randomization={randomMapping} />
            </div>
        </div>
    )
}

import Image from 'next/image'

function NaguiAnswerImage({ correct }) {
    if (correct === true) {
        return <Image
            src={IMAGES.NAGUI.CORRECT}
            alt="Correct answer"
            width={0}
            height={0}
            style={{ width: '100%', height: 'auto' }}
        />
    }
    if (correct === false) {
        return <Image
            src={IMAGES.NAGUI.WRONG}
            alt="Wrong answer"
            width={0}
            height={0}
            style={{ width: '80%', height: 'auto' }}
        />
    }
    return <></>
}

function NaguiMainContentQuestion({ baseQuestion, randomization }) {
    const game = useGameContext()

    const gameQuestionRepo = new RoundNaguiQuestionRepository(game.id, game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion)
    
    if (gameQuestionError) {
        return <p><strong>Error: {JSON.stringify(gameQuestionError)}</strong></p>
    }
    if (gameQuestionLoading) {
        return <LoadingScreen loadingText='Loading...' />
    }
    if (!gameQuestion) {
        return <></>
    }

    return (
        <div className='flex flex-row h-full w-full items-center justify-center'>
            <div className='flex flex-col h-full w-1/4 items-center justify-center'>
                <NaguiAnswerImage correct={gameQuestion.correct} />
            </div>
            {game.status === GameStatus.QUESTION_ACTIVE && <ActiveNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestion} randomization={randomization} />}
            {game.status === GameStatus.QUESTION_END && <EndedNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestion} randomization={randomization} />}
            <div className='flex flex-col h-full w-1/4 items-center justify-center'>
                <NaguiAnswerImage correct={gameQuestion.correct} />
            </div>
        </div>
    )
}


const choiceIsDisabled = (choiceIdx, myRole, isChooser, option, duoIdx, answerIdx) => {
    if (!(myRole === UserRole.PLAYER && isChooser))
        return true
    if (option === DuoNaguiOption.TYPE)
        return !(choiceIdx === duoIdx || choiceIdx === answerIdx)
    if (option === SquareNaguiOption.TYPE)
        return false
    return true
}

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"


function ActiveNaguiChoices({ baseQuestion, gameQuestion, randomization }) {
    const game = useGameContext()
    const myTeam = useTeamContext()
    const myRole = useRoleContext()
    const user = useUserContext()

    const choices = baseQuestion.items
    const answerIdx = baseQuestion.answerIdx
    const duoIdx = baseQuestion.duoIdx

    const isChooser = myTeam === gameQuestion.teamId

    const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx) => {
        await selectNaguiChoice(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, idx)
    })

    if (gameQuestion.option === null || gameQuestion.option === HideNa) {
        // return <Image src={nagui_correct.src} height={'70%'} />
        return <span className='2xl:text-6xl'>{NaguiQuestion.OPTION_TO_EMOJI[HideNa]} {NaguiQuestion.OPTION_TO_EMOJI['square']} {NaguiQuestion.OPTION_TO_EMOJI['duo']} ?</span>
    }


    return (
        <List className='rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3'>
            {randomization.map((origIdx, idx) => (
                // If the question is a duo question, only show the duoIdx and answerIdx
                (gameQuestion.option !== DuoNaguiOption.TYPE || (origIdx === answerIdx || origIdx === duoIdx)) && (
                    <ListItemButton key={idx}
                        divider={idx !== choices.length - 1}
                        disabled={isSubmitting || choiceIsDisabled(origIdx, myRole, isChooser, gameQuestion.option, duoIdx, answerIdx)}
                        sx={{
                            '&.Mui-disabled': { opacity: 1 },
                        }}
                        className='border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400'
                        onClick={() => handleSelectChoice(origIdx)}
                    >
                        <ListItemText
                            primary={`${NaguiQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
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
import RoundNaguiQuestionRepository from '@/backend/repositories/question/game/GameNaguiQuestionRepository'

function EndedNaguiChoices({ baseQuestion, gameQuestion, randomization }) {
    const choices = baseQuestion.choices
    const answerIdx = baseQuestion.answerIdx

    const choiceIdx = gameQuestion.choiceIdx
    const correct = gameQuestion.correct
    const playerId = gameQuestion.playerId
    const option = gameQuestion.option

    const isCorrectAnswer = idx => ((option === HideNaguiOption.TYPE && correct && idx === answerIdx) || idx === answerIdx);
    const isIncorrectChoice = idx => (option === DuoNaguiOption.TYPE || option === SquareNaguiOption.TYPE) && idx === choiceIdx && idx !== answerIdx;
    const isNeutralChoice = idx => ((option === HideNaguiOption.TYPE && correct && idx !== answerIdx) || (idx !== choiceIdx && idx !== answerIdx));

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
        if (correct && idx === answerIdx) {
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

        if (option !== HideNaguiOption.TYPE && correct === false && idx === choiceIdx) {
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
                        primary={`${NaguiQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
                        primaryTypographyProps={{ className: clsx('2xl:text-2xl', getTextColor(origIdx)) }}
                    />
                    {getListItemIcon(origIdx)}
                </ListItemButton>
            ))}
        </List>
    );
}

function PlayerAvatar({ playerId }) {
    const { playerRepo } = useGameRepositoriesContext()
    const { player, playerLoading, playerError } = playerRepo.usePlayerOnce(playerId)

    return (
        !playerError && !playerLoading && player && (
            <Avatar
                alt={player.name}
                src={player.image}
                sx={{ width: 30, height: 30 }}
            />
        )
    )
}