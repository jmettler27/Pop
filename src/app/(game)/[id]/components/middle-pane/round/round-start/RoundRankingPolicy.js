import { rankingToEmoji, numberToKeycapEmoji } from '@/lib/utils/emojis'

export function RoundRankingPolicy({ round }) {
    switch (round.type) {
        case 'special':
            return <SpecialRoundRankingPolicy round={round} />
        default: return (
            <div className='flex flex-col items-center justify-start space-y-4 p-2'>
                <RoundRankingPolicyTitle round={round} />
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

function RoundRankingPolicyTitle({ round }) {
    switch (round.type) {
        case 'progressive_clues':
        case 'image':
        case 'blindtest':
        case 'emoji':
        case 'enum':
        case 'basic':
        case 'nagui':
            return <RiddleRoundRankingPolicyTitle round={round} />
        case 'quote':
            return <QuoteRoundRankingPolicyTitle round={round} />
        case 'label':
            return <LabelRoundRankingPolicyTitle round={round} />
        case 'odd_one_out':
            return <OddOneOutRoundRankingPolicyTitle round={round} />
        case 'matching':
            return <MatchingRoundRankingPolicyTitle round={round} />
        case 'mcq':
            return <MCQRoundRankingPolicyTitle round={round} />
        default:
            return <></>
    }
}

function RiddleRoundRankingPolicyTitle({ round }) {
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.rewardsPerQuestion} point</span> par bonne réponse</h1>
}

function QuoteRoundRankingPolicyTitle({ round }) {
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.rewardsPerElement} point</span> par bon élément trouvé</h1>
}

function LabelRoundRankingPolicyTitle({ round }) {
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{round.rewardsPerElement} point</span> par bon élément trouvé</h1>
}

function OddOneOutRoundRankingPolicyTitle({ round }) {
    const { mistakePenalty } = round
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{mistakePenalty} point{Math.abs(mistakePenalty) > 1 ? 's' : ''}</span> par intrus trouvé</h1>
}

function MatchingRoundRankingPolicyTitle({ round }) {
    const { mistakePenalty } = round
    return <h1 className='2xl:text-3xl'><span className='font-bold'>{mistakePenalty} point{Math.abs(mistakePenalty) > 1 ? 's' : ''}</span> par mauvais lien créé</h1>
}

function MCQRoundRankingPolicyTitle({ round }) {
    return <>
        <h1 className='2xl:text-3xl text-center'>Un nombre variable de points par bonne réponse</h1>
    </>
}

function SpecialRoundRankingPolicy({ round }) {
    return (
        <div className='flex flex-col items-center justify-start space-y-4'>
            <h1 className='2xl:text-3xl text-center'>😨 Vos <strong>points accumulés</strong> jusqu&apos;à présent = votre <strong>nombre de droits à l&apos;erreur</strong></h1>
            <div className='flex flex-col items-center justify-start'>
                <p className='2xl:text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
            </div>
        </div>
    )
}