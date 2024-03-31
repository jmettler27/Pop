import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'

import { numberToKeycapEmoji } from '@/lib/utils/emojis'

import { RoundDescription } from './RoundDescription'
import { RoundRules } from './RoundRules'
import { RoundRewards } from './RoundRewards'

export default function RoundStartBody({ round }) {
    return (
        <div className='flex flex-row justify-around w-full h-full p-10 [&>*]:'>

            {/* General principle + Number of questions */}
            <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>
                <RoundGeneralInfo round={round} />
            </div>

            {/* Additional Remarks */}
            <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>
                <div className='flex flex-col items-center justify-start space-y-4 p-2'>
                    <h1 className='text-3xl font-bold'>📜 Règles</h1>
                    <RoundRules round={round} />
                </div>
            </div>

            {/* Scaling */}
            <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>
                <RoundRewards round={round} />
            </div>
        </div >
    )
}

/* ================================================================ Round Info ================================================================ */
function RoundGeneralInfo({ round }) {
    const numQuestions = round.questions.length
    return (
        <div className='flex flex-col items-center justify-start p-2'>
            {round.type === 'finale' ?
                <h1 className='text-3xl mb-4 font-bold'>{<FinaleNumThemes round={round} />} thèmes</h1> :
                <h1 className='text-3xl mb-4 font-bold'>{numberToKeycapEmoji(numQuestions)} question{numQuestions > 1 && 's'}</h1>
            }
            <RoundDescription round={round} />
        </div>
    )
}

function FinaleNumThemes({ round }) {
    const game = useGameContext()
    const [themes, themesLoading, themesError] = useCollection(collection(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'themes'))
    return <span>{(!themesError && !themesLoading && themes) ? numberToKeycapEmoji(themes.docs.length) : '???'}</span>
}
