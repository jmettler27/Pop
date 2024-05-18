import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { doc } from 'firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'

import PlayerName from '@/app/(game)/[id]/components/PlayerName'
import { rankingToEmoji } from '@/lib/utils/emojis'

export default function EnumPlayers({ lang = 'en' }) {
    const game = useGameContext()

    const [players, playersLoading, playersError] = useDocumentData(doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion, 'realtime', 'players'))

    if (playersError) {
        return <p><strong>Error: </strong>{JSON.stringify(playersError)}</p>
    }
    if (playersLoading) {
        return <></>
    }
    if (!players) {
        return <></>
    }

    const bets = players.bets.sort((a, b) => b.bet - a.bet)

    return (
        <div className='flex flex-row h-full w-full'>
            {bets.length > 0 && (
                <div className='flex flex-col h-full w-full justify-start p-2'>
                    <h2 className='font-bold'>{BETS_HEADER[lang]}</h2>
                    <ol className='overflow-auto'>
                        {bets.map((bet, index) => {
                            return (
                                <li key={index}>
                                    {rankingToEmoji(index)} <PlayerName playerId={bet.playerId} teamColor={false} />: {bet.bet}
                                </li>
                            )
                        })}
                    </ol>
                </div>
            )}
        </div>
    )
}

const BETS_HEADER = {
    'en': 'Bets',
    'fr-FR': 'Paris',
}
