import { useGameContext } from '@/app/(game)/contexts'

import clsx from 'clsx'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'


export default function GameChooserOrder({ gameStates, lang = 'fr-FR' }) {
    const game = useGameContext()

    const [teams, teamsLoading, teamsError] = useCollection(collection(GAMES_COLLECTION_REF, game.id, 'teams'))
    if (teamsError) {
        return <p><strong>Error: {JSON.stringify(teamsError)}</strong></p>
    }
    if (teamsLoading) {
        return <></>
    }
    if (!teams) {
        return <></>
    }

    return (
        <div className='flex flex-col h-full w-full items-center justify-center'>

            <h2 className='xl:text-xl 2xl:text-2xl font-bold'>👥 <span className='underline'>{RUNNING_ORDER_TEXT[lang]}</span></h2>

            <ol className='overflow-auto'>
                {gameStates.chooserOrder.map((teamId, idx) => (
                    <li key={idx} className={clsx(
                        'xl:text-xl 2xl:text-2xl',
                        (idx === gameStates.chooserIdx) && 'text-focus',
                    )}>
                        {idx + 1}. {getTeamName(teams, teamId)}
                    </li>
                ))}
            </ol>
        </div>
    )
}

function getTeamName(teams, teamId) {
    return teams.docs.find(doc => doc.id === teamId).data().name
    // return teams.find(team => team.id === teamId).name
}

const RUNNING_ORDER_TEXT = {
    'en': "Running order",
    'fr-FR': "Ordre de passage"
}