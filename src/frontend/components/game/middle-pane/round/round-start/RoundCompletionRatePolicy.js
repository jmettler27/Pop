import { numberToKeycapEmoji } from '@/backend/utils/emojis'

import { RoundType } from '@/backend/models/rounds/RoundType'


export function RoundCompletionRatePolicy({ round }) {
    return (
        <div className='flex flex-col items-center justify-start space-y-4 p-2'>
            <RoundCompletionRatePolicyTitle round={round} />
            <div className='flex flex-col items-center justify-start'>
                <RoundMaxNumPoints round={round} />
            </div>
        </div>
    )
}

function RoundCompletionRatePolicyTitle({ round }) {
    switch (round.type) {
        case RoundType.BASIC:
        case RoundType.BLINDTEST:
        case RoundType.EMOJI:
        case RoundType.ENUMERATION:
        case RoundType.IMAGE:
        case RoundType.MCQ:
        case RoundType.PROGRESSIVE_CLUES:
            return <BuzzerRoundCompletionRatePolicyTitle round={round} />
        case RoundType.LABELLING:
            return <LabellingRoundCompletionRatePolicyTitle round={round} />
        case RoundType.MATCHING:
            return <MatchingRoundCompletionRatePolicyTitle round={round} />
        case RoundType.NAGUI:
            return <NaguiRoundCompletionRatePolicyTitle round={round} />
        case RoundType.ODD_ONE_OUT:
            return <OddOneOutRoundCompletionRatePolicyTitle round={round} />
        case RoundType.QUOTE:
            return <QuoteRoundCompletionRatePolicyTitle round={round} />
        default:
            return <></>
    }
}

function RoundMaxNumPoints({ round }) {
    switch (round.type) {
        case RoundType.BASIC:
        case RoundType.BLINDTEST:
        case RoundType.EMOJI:
        case RoundType.ENUMERATION:
        case RoundType.IMAGE:
        case RoundType.LABELLING:
        case RoundType.MCQ:
        case RoundType.NAGUI:
        case RoundType.PROGRESSIVE_CLUES:
        case RoundType.QUOTE:
            return <h1 className='2xl:text-3xl text-center'>Points max / équipe: <span className='font-bold'>{numberToKeycapEmoji(round.maxPoints)}</span></h1>
        default:
            return <></>
    }

}


function BuzzerRoundCompletionRatePolicyTitle({ round }) {
    return <h1 className='2xl:text-3xl text-center'>✨ <span className='text-center text-green-500'><strong>{round.rewardsPerQuestion} point</strong> par bonne réponse</span> </h1>
}

function QuoteRoundCompletionRatePolicyTitle({ round }) {
    return <h1 className='2xl:text-3xl text-center'>✨ <span className='text-center text-green-500'><strong>{round.rewardsPerElement} point</strong> par bon élément trouvé</span></h1>
}

function LabellingRoundCompletionRatePolicyTitle({ round }) {
    return <h1 className='2xl:text-3xl text-center'>✨ <span className='text-center text-green-500'><strong>{round.rewardsPerElement} point</strong> par bonne étiquette trouvée</span></h1>
}

function OddOneOutRoundCompletionRatePolicyTitle({ round }) {
    const { mistakePenalty } = round
    const absPenalty = Math.abs(mistakePenalty)
    return <h1 className='2xl:text-2xl text-center'>✨ Sélectionner un intrus = <span className='text-red-500'><strong>{mistakePenalty} point{absPenalty > 1 ? 's' : ''}</strong> sur le score global</span></h1>
}

function MatchingRoundCompletionRatePolicyTitle({ round }) {
    const { mistakePenalty } = round
    const absPenalty = Math.abs(mistakePenalty)
    return <h1 className='2xl:text-2xl text-center'>✨ Dessiner un lien incorrect = <span className='text-red-500'><strong>{mistakePenalty} point{absPenalty > 1 ? 's' : ''}</strong> sur le score global</span></h1>
}

function NaguiRoundCompletionRatePolicyTitle({ }) {
    return <>
        <h1 className='2xl:text-3xl text-center'>✨ Un nombre variable de points par bonne réponse</h1>
    </>
}

function SpecialRoundCompletionRatePolicy({ round }) {
    return (
        <div className='flex flex-col items-center justify-start space-y-4'>
            <h1 className='2xl:text-3xl text-center'>😨 Vos <strong>points accumulés</strong> jusqu&apos;à présent = votre <strong>nombre de droits à l&apos;erreur</strong></h1>
            <div className='flex flex-col items-center justify-start'>
                <p className='2xl:text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
            </div>
        </div>
    )
}