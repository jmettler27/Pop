import { useUserContext } from '@/app/contexts'
import { useGameContext } from '@/app/(game)/contexts'

import { Button, IconButton, Tooltip } from '@mui/material'
import ReplayIcon from '@mui/icons-material/Replay'
import PanToolIcon from '@mui/icons-material/PanTool'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import clsx from 'clsx'

import { addBuzzedPlayer, removeBuzzedPlayer } from '@/app/(game)/lib/question/riddle'
import { useAsyncAction } from '@/lib/utils/async'

export default function RiddlePlayerController({ players }) {
    const game = useGameContext()
    const user = useUserContext()

    const [player, playerLoading, playerError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'players', user.id))
    const [round, roundLoading, roundError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound))

    if (playerError) {
        return <p><strong>Error: </strong>{JSON.stringify(playerError)}</p>
    }
    if (roundError) {
        return <p><strong>Error: </strong>{JSON.stringify(roundError)}</p>
    }
    if (playerLoading || roundLoading) {
        return <></>
    }
    if (!player || !round) {
        return <></>
    }

    const buzzed = players.buzzed
    const canceled = players.canceled

    const myCanceledItems = canceled.filter(item => item.playerId === user.id)
    const hasExceededMaxTries = myCanceledItems && myCanceledItems.length >= round.maxTries

    const hasBuzzed = buzzed.includes(user.id)
    const isFirst = hasBuzzed && buzzed[0] === user.id

    return (
        <div className='flex flex-col h-full items-center justify-around'>
            <BuzzerMessage playerStatus={player.status} hasExceededMaxTries={hasExceededMaxTries} round={round} myCanceledItems={myCanceledItems} isFirst={isFirst} hasBuzzed={hasBuzzed} />
            <div className='flex flex-row w-full justify-center'>
                <BuzzerButton isDisabled={hasBuzzed || hasExceededMaxTries} />
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
    'fr-FR': "Attenton, c'est ton dernier essai."
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

function BuzzerMessage({ playerStatus, hasExceededMaxTries, round, myCanceledItems, isFirst, hasBuzzed, lang = 'en' }) {
    const game = useGameContext()
    const realtimeDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeDocRef)
    if (realtimeError) {
        return <p><strong>Error: </strong>{JSON.stringify(realtimeError)}</p>
    }
    if (realtimeLoading) {
        return <></>
    }
    if (!realtime) {
        return <></>
    }

    if (playerStatus === 'wrong' || hasExceededMaxTries) {
        if (hasExceededMaxTries)
            return <span className='text-3xl'>{MAX_TRIES_EXCEEDED_TEXT[lang]} ({round.maxTries})</span>
        const message = RIDDLE_INCORRECT_ASNWER_TEXT[lang]
        if (round.type === 'progressive_clues' && round.delay && round.delay > 0) {
            const remaining = remainingWaitingClues(round, realtime.currentClueIdx, myCanceledItems)
            return <span className='text-3xl'>{message} {CANCELED_WARNING_TEXT[lang]} <span className='font-bold text-blue-500'>{remaining > 1 ? numRemainingClues(remaining, lang) : ONE_MORE_WAITING_CLUE_TEXT[lang]}.</span></span>
        }
        return <span className='text-3xl'>{message}</span>
    }
    if (isFirst) {
        const message = `${RIDDLE_FIRST_BUZZER_TEXT[lang]} 🧐`
        if (myCanceledItems.length === round.maxTries - 1)
            return <span className='text-3xl'>{message}. <span className='text-red-500'>{LAST_ATTEMPT_TEXT[lang]}</span></span>
        return <span className='text-3xl'>{message}</span>
    }
    if (hasBuzzed)
        return <span className='text-3xl'>{WAITING_FOR_TURN_TEXT[lang]}</span>
    return <span className='text-3xl'>{RIDDLE_IDLE_TEXT[lang]} 🤔</span>
}



function remainingWaitingClues(round, currentClueIdx, myCanceledItems) {
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
        await addBuzzedPlayer(game.id, game.currentRound, game.currentQuestion, user.id)
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
            <span className={clsx('text-3xl', !isDisabled && 'text-slate-100')}>BUZZ</span>
        </Button>
    )
}

function BuzzerResetButton({ isDisabled }) {
    const game = useGameContext()
    const user = useUserContext()

    const [handleResetBuzz, isResetting] = useAsyncAction(async () => {
        await removeBuzzedPlayer(game.id, game.currentRound, game.currentQuestion, user.id)
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
