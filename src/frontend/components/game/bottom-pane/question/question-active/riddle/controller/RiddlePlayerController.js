import { addPlayerToBuzzer, removePlayerFromBuzzer } from '@/backend/services/question/riddle/actions_old'

import GameQuestionRepository from '@/backend/repositories/question/game/GameQuestionRepository'

import { PlayerStatus } from '@/backend/models/users/Player'
import { QuestionType } from '@/backend/models/questions/QuestionType'


import { useUserContext, useGameContext, useGameRepositoriesContext } from '@/frontend/contexts'

import useAsyncAction from "@/frontend/hooks/async/useAsyncAction"

import { DEFAULT_LOCALE } from '@/frontend/utils/locales'

import { Button, IconButton, Tooltip } from '@mui/material'
import ReplayIcon from '@mui/icons-material/Replay'
import PanToolIcon from '@mui/icons-material/PanTool'

import clsx from 'clsx'


export default function RiddlePlayerController({ players: riddlePlayers }) {
    const game = useGameContext()
    const user = useUserContext()

    const { playerRepo, roundRepo } = useGameRepositoriesContext()
    const gameQuestionRepo = new GameQuestionRepository(game.id, game.currentRound)

    const { player, playerLoading, playerError } = playerRepo.usePlayer(user.id)
    const { round, roundLoading, roundError } = roundRepo.useRound(game.currentRound)
    const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion)
    
    if (playerError) {
        return <p><strong>Error: </strong>{JSON.stringify(playerError)}</p>
    }
    if (roundError) {
        return <p><strong>Error: </strong>{JSON.stringify(roundError)}</p>
    }
    if (gameQuestionError) {
        return <p><strong>Error: </strong>{JSON.stringify(gameQuestionError)}</p>
    }
    if (playerLoading || roundLoading || gameQuestionLoading) {
        return <></>
    }
    if (!player || !round || !gameQuestion) {
        return <></>
    }

    const { buzzed, canceled } = riddlePlayers

    const hasBuzzed = buzzed.includes(user.id)
    const isFirst = hasBuzzed && buzzed[0] === user.id

    const myCanceledItems = canceled.filter(item => item.playerId === user.id)
    const hasExceededMaxTries = myCanceledItems && myCanceledItems.length >= round.maxTries
    const remaining = remainingWaitingClues(round, hasExceededMaxTries, gameQuestion.currentClueIdx, myCanceledItems)

    return (
        <div className='flex flex-col h-full items-center justify-around'>
            <BuzzerMessage playerStatus={player.status} hasExceededMaxTries={hasExceededMaxTries} round={round} myCanceledItems={myCanceledItems} isFirst={isFirst} hasBuzzed={hasBuzzed} remaining={remaining} />
            <div className='flex flex-row w-full justify-center'>
                <BuzzerButton isDisabled={hasBuzzed || hasExceededMaxTries || remaining > 0} />
                <BuzzerResetButton isDisabled={!hasBuzzed || hasExceededMaxTries} />
            </div>
        </div>
    )
}

const numRemainingClues = (remaining, lang) => {
    switch (lang) {
        case 'en':
            return `in ${remaining} clues`
        case 'fr-FR':
            return `dans ${remaining} indices`
    }
}

const ONE_MORE_WAITING_CLUE_TEXT = {
    'en': "at the next clue",
    'fr-FR': "au prochain indice"
}

const MAX_TRIES_EXCEEDED_TEXT = {
    'en': "You have exceeded the maximum number of tries!",
    'fr-FR': "Tu as excédé le nombre maximum d'essais!"
}

const CANCELED_WARNING_TEXT = {
    'en': "You will be able to buzz again",
    'fr-FR': "Tu pourras de nouveau buzzer"
}


const LAST_ATTEMPT_TEXT = {
    'en': "Attention, it's your last attempt.",
    'fr-FR': "Attention, c'est ton dernier essai."
}

const WAITING_FOR_TURN_TEXT = {
    'en': "Wait for your turn...",
    'fr-FR': "Attends ton tour..."
}

const RIDDLE_IDLE_TEXT = {
    'en': "Any idea?",
    'fr-FR': "Une idée?"
}

const RIDDLE_FIRST_BUZZER_TEXT = {
    'en': "We're all ears",
    'fr-FR': "On t'écoute"
}

const RIDDLE_INCORRECT_ASNWER_TEXT = {
    'en': "Wrong answer!",
    'fr-FR': "Mauvaise réponse!"
}

function BuzzerMessage({ playerStatus, hasExceededMaxTries, round, myCanceledItems, isFirst, hasBuzzed, remaining, lang = DEFAULT_LOCALE }) {
    if (hasExceededMaxTries)
        return <span className='2xl:text-3xl text-red-500'>🤐 {MAX_TRIES_EXCEEDED_TEXT[lang]} ({round.maxTries})</span>

    if (playerStatus === PlayerStatus.WRONG) {
        const message = RIDDLE_INCORRECT_ASNWER_TEXT[lang]
        if (round.type === QuestionType.PROGRESSIVE_CLUES && round.delay && round.delay > 0) {
            return <span className='2xl:text-3xl'>{message} {CANCELED_WARNING_TEXT[lang]} <span className='font-bold text-blue-500'>{remaining > 1 ? numRemainingClues(remaining, lang) : ONE_MORE_WAITING_CLUE_TEXT[lang]}.</span></span>
        }
        return <span className='2xl:text-3xl text-red-500'>{message}</span>
    }
    if (isFirst) {
        const message = `${RIDDLE_FIRST_BUZZER_TEXT[lang]} 🧐`
        if (myCanceledItems.length === round.maxTries - 1)
            return <span className='2xl:text-3xl'>{message}. <span className='text-red-500'>{LAST_ATTEMPT_TEXT[lang]}</span></span>
        return <span className='2xl:text-3xl'>{message}</span>
    }
    if (hasBuzzed)
        return <span className='2xl:text-3xl'>{WAITING_FOR_TURN_TEXT[lang]}</span>
    return <span className='2xl:text-3xl'>{RIDDLE_IDLE_TEXT[lang]} 🤔</span>
}



function remainingWaitingClues(round, hasExceededMaxTries, currentClueIdx, myCanceledItems) {
    if (!round.delay)
        return 0
    if (myCanceledItems.length === 0)
        return 0
    if (hasExceededMaxTries)
        return 1 // arbitrary positive value
    const lastCanceledClueIdx = myCanceledItems.reduce((acc, item) => {
        if (item.clueIdx > acc)
            return item.clueIdx
        return acc
    }, -1)
    return round.delay - (currentClueIdx - lastCanceledClueIdx)
}


function BuzzerButton({ isDisabled }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleBuzz, isBuzzing] = useAsyncAction(async () => {
        await addPlayerToBuzzer(game.id, game.currentRound, game.currentQuestion, user.id)
    })

    return (
        <Button
            size='large'
            variant='contained'
            color='primary'
            onClick={handleBuzz}
            disabled={isDisabled || isBuzzing}
            style={{ backgroundColor: isDisabled ? 'gray' : 'red' }}
            endIcon={<PanToolIcon />}
        >
            <span className={clsx('2xl:text-3xl', !isDisabled && 'text-slate-100')}>BUZZ</span>
        </Button>
    )
}

function BuzzerResetButton({ isDisabled }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleResetBuzz, isResetting] = useAsyncAction(async () => {
        await removePlayerFromBuzzer(game.id, game.currentRound, game.currentQuestion, user.id)
    })

    return (
        <Tooltip
            title="Annuler"
            placement='right'
        >
            <span>
                <IconButton
                    color='primary'
                    aria-label='reset buzzer'
                    onClick={handleResetBuzz}
                    disabled={isDisabled || isResetting}
                >
                    <ReplayIcon />
                </IconButton>
            </span>
        </Tooltip>
    )
}
