import { rankingToEmoji, numberToKeycapEmoji } from '@/lib/utils/emojis'

export function RoundRewards({ round }) {
    switch (round.type) {
        case 'finale':
            return <ThemesRoundRewards round={round} />
        default: return (
            <div className='flex flex-col items-center justify-start space-y-4 p-2'>
                <RoundRewardsTitle round={round} />
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
}

function RoundRewardsTitle({ round }) {
    switch (round.type) {
        case 'progressive_clues':
        case 'image':
        case 'blindtest':
        case 'emoji':
        case 'enum':
        case 'basic':
            return <RiddleRoundRewardsTitle round={round} />
        case 'quote':
            return <QuoteRoundRewardsTitle round={round} />
        case 'odd_one_out':
            return <OddOneOutRoundRewardsTitle round={round} />
        case 'matching':
            return <MatchingRoundRewardsTitle round={round} />
        case 'mcq':
            return <MCQRoundRewardsTitle round={round} />
        default:
            return <></>
    }
}

function RiddleRoundRewardsTitle({ round }) {
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.rewardsPerQuestion} point</span> par bonne réponse</h1>
}

function QuoteRoundRewardsTitle({ round }) {
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.rewardsPerElement} point</span> par bon élément trouvé</h1>
}

function OddOneOutRoundRewardsTitle({ round }) {
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.mistakePenalty} point</span> par intrus trouvé</h1>
}

function MatchingRoundRewardsTitle({ round }) {
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.mistakePenalty} point</span> par mauvais lien créé</h1>
}

function MCQRoundRewardsTitle({ round }) {
    return <>
        <h1 className='2xl:text-3xl text-center'>Un nombre variable de points par bonne réponse</h1>
    </>
}

function ThemesRoundRewards({ round }) {
    return (
        <div className='flex flex-col items-center justify-start space-y-4'>
            <h1 className='2xl:text-3xl text-center'>😨 Vos <strong>points accumulés</strong> jusqu&apos;à présent = votre <strong>nombre de droits à l&apos;erreur</strong></h1>
            <div className='flex flex-col items-center justify-start'>
                <p className='2xl:text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
            </div>
        </div>
    )
}