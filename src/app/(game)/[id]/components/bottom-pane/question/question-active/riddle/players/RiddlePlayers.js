
import { useParams } from 'next/navigation';

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore';
import { collection } from 'firebase/firestore'
import { useCollectionOnce } from 'react-firebase-hooks/firestore'

export default function RiddlePlayers({ players, lang = 'en' }) {
    const { id: gameId } = useParams()

    const [gamePlayers, gamePlayersLoading, gamePlayersError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'players'))
    if (gamePlayersError) {
        return <p><strong>Error: {JSON.stringify(gamePlayersError)}</strong></p>
    }
    if (gamePlayersLoading) {
        return <></>
    }
    if (!gamePlayers) {
        return <></>
    }

    const buzzed = players.buzzed
    const canceled = players.canceled

    return (
        <div className='flex flex-row h-full w-full'>
            {/* Players who are in the buzzed list */}
            <div className='flex flex-col h-full w-1/2 justify-start p-2'>
                <h2 className='font-bold text-xl'>{BUZZED_TEXT[lang]}</h2>
                {(buzzed && buzzed.length > 0) ?
                    <BuzzedPlayers buzzed={buzzed} players={gamePlayers} /> :
                    <p className='text-xl italic opacity-50'>{NO_BUZZERS[lang]}</p>
                }
            </div>

            {/* Players who are in the canceled list */}
            {canceled && canceled.length > 0 && (
                <div className='flex flex-col h-full w-1/2 justify-start p-2'>
                    <h2 className='font-bold text-xl'>{CANCELED_TEXT[lang]}</h2>
                    <CanceledPlayers canceled={canceled} players={gamePlayers} />
                </div>
            )}
        </div>
    )
}

const NO_BUZZERS = {
    'en': "Nobody",
    'fr-FR': "y a personne"
}

const BUZZED_TEXT = {
    'en': "Buzzers",
    'fr-FR': "Buzzeurs"
}

const CANCELED_TEXT = {
    'en': "N00bs",
    'fr-FR': "Nullos"
}

import { rankingToEmoji } from '@/lib/utils/emojis';

function getPlayerName(players, playerId) {
    return players.docs.find(doc => doc.id === playerId).data().name
}

function BuzzedPlayers({ buzzed, players }) {
    return (
        <ol className='overflow-auto'>
            {buzzed.map((playerId, index) => (
                <li key={index} className='text-xl'>{rankingToEmoji(index)} {getPlayerName(players, playerId)}</li>
            ))}
        </ol>
    )
}

function CanceledPlayers({ canceled, players }) {
    return (
        <ol className='overflow-auto'>
            {canceled.map((item, index) => (
                <li key={index} className='text-xl'>💩 {getPlayerName(players, item.playerId)} (#{item.clueIdx + 1})</li>
            ))}
        </ol>
    )
}