import { rankingToEmoji, numberToKeycapEmoji } from '@/lib/utils/emojis'

export function RoundCompletionRatePolicy({ round }) {
    return (
        <div className='flex flex-col items-center justify-start space-y-4 p-2'>
            <RoundCompletionRatePolicyTitle round={round} />
            <div className='flex flex-col items-center justify-start'>
                <p className='2xl:text-2xl'>Le barème</p>
                <ol className='2xl:text-2xl border-solid border-yellow-500 border-2 p-2'>
                    {round.rewards.map((reward, index) => (
                        <li key={index}>{rankingToEmoji(index)} {reward} pts</li>
                    ))}
                    {/* <li key={round.rewards.length - 1}>...  0 pts</li> */}
                </ol>
                <br></br>
                <p className='2xl:text-2xl text-center'>où les équipes sont classées dans l&apos;ordre <strong>{(round.type === 'odd_one_out' || round.type === 'matching') ? "⚠️ croissant" : "décroissant"}</strong> du nombre de points gagnés.</p>
            </div>
        </div>
    )
}

function RoundCompletionRatePolicyTitle({ round }) {
    switch (round.type) {
        case 'progressive_clues':
        case 'image':
        case 'blindtest':
        case 'emoji':
        case 'basic':
        case 'enum':
        case 'quote':
        case 'mcq':
            return <RoundMaxNumPoints round={round} />
        case 'odd_one_out':
        case 'matching':
            return <MatchingRoundCompletionRatePolicyTitle round={round} />
        default:
            return <></>
    }
}

function RoundMaxNumPoints({ round }) {
    const { maxPoints } = round
    return <h1 className='2xl:text-3xl'>MAX <span className='font-bold'>{numberToKeycapEmoji(maxPoints)} points</span></h1>
}


function MatchingRoundCompletionRatePolicyTitle({ round }) {
    const { mistakePenalty } = round
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.mistakePenalty} point</span> par mauvais lien créé</h1>
}


