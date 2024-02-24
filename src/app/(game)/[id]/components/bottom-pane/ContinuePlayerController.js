import { useParams } from 'next/navigation'

import { useGameContext } from '@/app/(game)/contexts'
import { useUserContext } from '@/app/contexts'

import { Button, CircularProgress } from '@mui/material'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'

import HowToRegIcon from '@mui/icons-material/HowToReg'
import { addSoundToQueue } from '@/app/(game)/lib/sounds'
import { updatePlayerStatus } from '@/app/(game)/lib/players'
import { getRandomElement } from '@/lib/utils/arrays'
import { useAsyncAction } from '@/lib/utils/async'

export default function ContinuePlayerController({ }) {
    const { id: gameId } = useParams()
    const user = useUserContext()

    const [player, playerLoading, playerError] = useDocumentData(doc(GAMES_COLLECTION_REF, gameId, 'players', user.id))
    return (
        <>
            {playerError && <p><strong>Error: </strong>{JSON.stringify(playerError)}</p>}
            {playerLoading && <LoadingScreen loadingText="Loading my info..." />}
            {player && <ReadyButton myStatus={player.status} />}
        </>
    )
}

function ReadyButton({ myStatus, lang = 'en' }) {
    const { id: gameId } = useParams()
    const user = useUserContext()

    const [handlePlayerReadyClick, isSubmitting] = useAsyncAction(async () => {
        await Promise.all([
            updatePlayerStatus(gameId, user.id, 'ready'),
            addSoundToQueue(gameId, 'pop', user.id),
        ])
    })

    return (
        <Button
            className='rounded-full'
            color='secondary'
            size='large'
            variant='contained'
            onClick={handlePlayerReadyClick}
            disabled={myStatus === 'ready' || isSubmitting}
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
    "Prêt à déguster les défis comme un chef étoilé de l'aventure!"
];


const READY_BUTTON_TEXT = {
    'en': getRandomElement(READY_BUTTON_TEXT_EN),
    'fr-FR': getRandomElement(READY_BUTTON_TEXT_FR)
}