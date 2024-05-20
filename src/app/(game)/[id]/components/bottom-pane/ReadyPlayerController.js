import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { useParams } from 'next/navigation'

import { Button, CircularProgress } from '@mui/material'
import HowToRegIcon from '@mui/icons-material/HowToReg'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'


export default function ReadyPlayerController({ isLastQuestion, lang = 'fr-FR' }) {
    const { id: gameId } = useParams()
    const myRole = useRoleContext();

    const [timer, timerLoading, timerError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'timer'))
    if (timerError) {
        return <p><strong>Error: {JSON.stringify(timerError)}</strong></p>
    }
    if (timerLoading) {
        return <CircularProgress />
    }
    if (!timer) {
        return <></>
    }

    return (
        timer.authorized && (
            <div className='flex flex-col items-center justify-center space-y-5'>
                <ReadyPlayerHeader isLastQuestion={isLastQuestion} />
                {myRole === 'player' && <ReadyPlayerButton lang={lang} />}
            </div>
        )
    )
}

function ReadyPlayerHeader({ isLastQuestion, lang = 'fr-FR' }) {
    const game = useGameContext();
    const myRole = useRoleContext();

    switch (myRole) {
        case 'organizer':
            return <></>
        case 'player':
            switch (game.status) {
                case 'game_start':
                    return <span className='2xl:text-3xl'>{READY_PLAYER_HEADER_START[lang]} <strong>{READY_PLAYER_HEADER_GAME_START[lang]}</strong>? 🥸</span>
                case 'round_start':
                    return <span className='2xl:text-3xl'>{READY_PLAYER_HEADER_START[lang]} <strong>{READY_PLAYER_HEADER_ROUND_START[lang]}</strong>? 🥸</span>
                case 'question_end':
                    return <span className='2xl:text-3xl'>{READY_PLAYER_HEADER_START[lang]} <strong>{isLastQuestion ? READY_PLAYER_HEADER_QUESTION_END_LAST[lang] : READY_PLAYER_HEADER_QUESTION_END[lang]}</strong>? 🥸</span>
            }
        default:
            return <ReadyPlayerHeaderSpectator lang={lang} />
    }
}

function ReadyPlayerHeaderSpectator({ lang = 'fr-FR' }) {
    const { id: gameId } = useParams()
    const readyDocRef = doc(GAMES_COLLECTION_REF, gameId, 'realtime', 'ready')
    const [ready, readyLoading, readyError] = useDocumentData(readyDocRef)
    if (readyError) {
        return <p><strong>Error: {JSON.stringify(readyError)}</strong></p>
    }
    if (readyLoading) {
        return <CircularProgress />
    }
    if (!ready) {
        return <></>
    }

    const { numReady, numPlayers } = ready

    return <span className='2xl:text-3xl'>{WAITING_FOR_PLAYERS_TEXT[lang]} ({numReady}/{numPlayers})</span>

}


const WAITING_FOR_PLAYERS_TEXT = {
    'en': "Waiting for players...",
    'fr-FR': "En attente des joueurs..."
}

const READY_PLAYER_HEADER_START = {
    'en': "Ready for",
    'fr-FR': "Chaud pour"
}


// GAME START
const READY_PLAYER_HEADER_GAME_START = {
    'en': "starting the game",
    'fr-FR': "démarrer la partie"
}

// ROUND START
const READY_PLAYER_HEADER_ROUND_START = {
    'en': "the first question",
    'fr-FR': "la première question"
}

// QUESTION END
const READY_PLAYER_HEADER_QUESTION_END = {
    'en': "the next question",
    'fr-FR': "la prochaine question"
}


const READY_PLAYER_HEADER_QUESTION_END_LAST = {
    'en': "the end of the round",
    'fr-FR': "la fin de la manche"
}


import { getRandomElement } from '@/lib/utils/arrays'
import { useAsyncAction } from '@/lib/utils/async'

import { setPlayerReady } from '@/app/(game)/lib/transitions'
import { useUserContext } from '@/app/contexts'

export function ReadyPlayerButton({ lang = 'fr-FR' }) {
    const { id: gameId } = useParams()
    const user = useUserContext()

    const [handleClickReady, isSubmitting] = useAsyncAction(async () => {
        await setPlayerReady(gameId, user.id)
    })

    const [player, playerLoading, playerError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId, 'players', user.id))
    if (playerError) {
        return <p><strong>Error: {JSON.stringify(playerError)}</strong></p>
    }
    if (playerLoading) {
        return <CircularProgress />
    }
    if (!player) {
        return <></>
    }

    return (
        <Button
            className='rounded-full'
            color='secondary'
            size='large'
            variant='contained'
            onClick={handleClickReady}
            disabled={player.status === 'ready' || isSubmitting}
            startIcon={<HowToRegIcon />}
        >
            {READY_BUTTON_TEXT[lang]}
        </Button>
    )
}


// Taken from https://responsefully.com/funny-ways-to-say-im-ready/
const READY_BUTTON_TEXT_EN = [
    "Let's do this like a boss",
    "I'm geared up and ready to roll",
    "My body is primed and pumped",
    "I'm prepped like a pro",
    "My engines are revved and ready to go",
    "I'm itching to get started",
    "I'm fired up and good to go",
    "I'm locked and loaded for action",
    "I'm amped up and raring to go",
    "My batteries are fully charged",
    "I'm chomping at the bit",
    "I'm all set and ready to rock",
    "I'm hyped up and ready to go",
    "I'm ready to take on the world",
    "Let's get this party started",
    "I'm in the zone and ready to dominate",
    "I'm all systems go",
    "I'm like a coiled spring, ready to unleash",
    "I'm prepped and pumped like a prizefighter",
    "I'm armed and dangerous, ready to tackle whatever comes my way"
]

const READY_BUTTON_TEXT_FR = [
    "Chui prêt",
    "Je suis prêt comme un ninja devant un buffet!",
    "Prêt à décoller comme une fusée en chocolat!",
    "Je suis prêt à affronter les licornes et les dragons!",
    "Prêt comme un écureuil devant une noisette!",
    "Je suis prêt à dévorer les énigmes comme un détective affamé!",
    "Prêt à rouler comme une boule de neige en descente!",
    "Je suis prêt à briller comme une étoile du rire!",
    "Prêt à plonger dans l'inconnu comme un explorateur de canapé!",
    "Je suis prêt comme un chat à la chasse aux souris!",
    "Prêt à déguster les défis comme un chef étoilé de l'aventure!",
    "Je suis prêt à bondir comme un kangourou en pleine forme!",
    "Prêt à m'envoler comme un oiseau de nuit!",
];

const READY_BUTTON_TEXT = {
    'en': getRandomElement(READY_BUTTON_TEXT_EN),
    'fr-FR': getRandomElement(READY_BUTTON_TEXT_FR)
}