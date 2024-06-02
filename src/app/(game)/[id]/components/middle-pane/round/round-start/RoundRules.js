import { BLINDTEST_THINKING_TIME } from "@/lib/utils/question/blindtest"
import { EMOJI_THINKING_TIME } from "@/lib/utils/question/emoji"
import { IMAGE_THINKING_TIME } from "@/lib/utils/question/image"
import { MATCHING_MAX_NUM_COLS, MATCHING_MIN_NUM_COLS, MATCHING_THINKING_TIME } from "@/lib/utils/question/matching"
import { OOO_THINKING_TIME } from "@/lib/utils/question/odd_one_out"
import { PROGRESSIVE_CLUES_THINKING_TIME } from "@/lib/utils/question/progressive_clues"
import { QUOTE_THINKING_TIME } from "@/lib/utils/question/quote"

export function RoundRules({ round }) {
    switch (round.type) {
        case 'progressive_clues':
            return <ProgressiveCluesRoundRules round={round} />
        case 'emoji':
            return <EmojiRoundRules round={round} />
        case 'image':
            return <ImageRoundRules round={round} />
        case 'blindtest':
            return <BlindtestRoundRules round={round} />
        case 'quote':
            return <QuoteRoundRules round={round} />
        case 'odd_one_out':
            return <OddOneOutRoundRules round={round} />
        case 'enum':
            return <EnumRoundRules round={round} />
        case 'matching':
            return <MatchingRoundRules round={round} />
        case 'mcq':
            return <MCQRoundRules round={round} />
        case 'finale':
            return <ThemesRoundRules round={round} />
    }
}

function ProgressiveCluesRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur &quot;Buzz&quot;</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur &quot;Annuler&quot;</strong>.</p>
        <p className='2xl:text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>Si votre réponse est <span className='2xl:text-green-500 font-bold'>correcte</span>, vous gagnez <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.</li>
            <li>Si votre réponse est <span className='2xl:text-red-500 font-bold'>incorrecte</span>, votre essai est invalidé et on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un. De plus, <strong>votre buzzer est désactivé jusqu&apos;à l&apos;indice i + {round.delay}</strong>.</li>
        </ul>
        <p className='2xl:text-2xl text-center'>⏳ Vous avez <u><strong>{PROGRESSIVE_CLUES_THINKING_TIME} secondes</strong></u> pour répondre, faute de quoi votre essai sera invalidé !</p>
        <p className='2xl:text-2xl text-center'>⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.</p>
    </>
}

function EmojiRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur &quot;Buzz&quot;</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur &quot;Annuler&quot;</strong>.</p>
        <p className='2xl:text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>Si votre réponse est <span className='2xl:text-green-500 font-bold'>correcte</span>, vous gagnez <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.</li>
            <li>Si votre réponse est <span className='2xl:text-red-500 font-bold'>incorrecte</span>, votre essai est invalidé et on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un.</li>
        </ul>
        <p className='2xl:text-2xl text-center'>⏳ Vous avez <u><strong>{EMOJI_THINKING_TIME} secondes</strong></u> pour répondre, faute de quoi votre essai sera invalidé !</p>
        <p className='2xl:text-2xl text-center'>⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.</p>
    </>
}

function ImageRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur &quot;Buzz&quot;</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur &quot;Annuler&quot;</strong>.</p>
        <p className='2xl:text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>Si votre réponse est <span className='2xl:text-green-500 font-bold'>correcte</span>, vous gagnez <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.</li>
            <li>Si votre réponse est <span className='2xl:text-red-500 font-bold'>incorrecte</span>, votre essai est invalidé et on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un.</li>
        </ul>
        <p className='2xl:text-2xl text-center'>⏳ Vous avez <u><strong>{IMAGE_THINKING_TIME} secondes</strong></u> pour répondre, faute de quoi votre essai sera invalidé !</p>
        <p className='2xl:text-2xl text-center'>⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.</p>
    </>
}

function BlindtestRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur &quot;Buzz&quot;</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur &quot;Annuler&quot;</strong>.</p>
        <p className='2xl:text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>Si votre réponse est <span className='2xl:text-green-500 font-bold'>correcte</span>, vous gagnez <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.</li>
            <li>Si votre réponse est <span className='2xl:text-red-500 font-bold'>incorrecte</span>, votre essai est invalidé et on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un.</li>
        </ul>
        <p className='2xl:text-2xl text-center'>⏳ Vous avez <u><strong>{BLINDTEST_THINKING_TIME} secondes</strong></u> pour répondre, faute de quoi votre essai sera invalidé !</p>
        <p className='2xl:text-2xl text-center'>⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.</p>
    </>
}

function QuoteRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur &quot;Buzz&quot;</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur &quot;Annuler&quot;</strong>.</p>
        <p className='2xl:text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.</p>
        <p className='2xl:text-2xl text-center'>⏳ Vous avez <u><strong>{QUOTE_THINKING_TIME} secondes</strong></u> pour répondre, faute de quoi votre essai sera invalidé !</p>
        <p className='2xl:text-2xl text-center'>⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.</p>
        <p className='2xl:text-2xl text-center'>😈 Vous pouvez gagner des points <strong>même si vous ne connaissez pas tous les éléments !</strong></p>
    </>
}


function OddOneOutRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>🖱️ Chaque équipe se relaie à son tour et <strong>clique sur une proposition de la liste qu&apos;elle considère juste</strong>.</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>Si la proposition est <span className='2xl:text-green-500 font-bold'>correcte</span>, on passe à l&apos;équipe suivante.</li>
            <li>Si la proposition est <span className='2xl:text-red-500 font-bold'>incorrecte</span>, on termine la question et l&apos;équipe obtient <strong>{round.mistakePenalty} point de pénalité.</strong> De plus, elle devient <strong>1ère dans l&apos;ordre de passage de la question suivante</strong>.</li>
        </ul>
        <p className='2xl:text-2xl text-center'>ℹ️ Une petite <strong>explication</strong> est affichée à chaque fois.</p>
        <p className='2xl:text-2xl text-center'>⏳ Vous avez <u><strong>{OOO_THINKING_TIME} secondes</strong></u> pour vous décider, faute de quoi <strong>une proposition sera choisie aléatoirement dans la liste !</strong></p>
        <p className='2xl:text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
    </>
}

function EnumRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>La question se déroule en <strong>deux temps</strong> :</p>
        <ol className='2xl:text-2xl list-decimal pl-10'>
            <li>🤔 Une phase de <strong>réflexion</strong> durant laquelle les équipes choisissent leur pari.</li>
            <li>🗣️ Une phase de <strong>réponse</strong> durant laquelle l&apos;équipe qui a donné le plus gros pari énonce ses réponses. </li>
        </ol>
        <p className='2xl:text-2xl'>Il y a alors deux issues possibles :</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>Le pari est <span className='2xl:text-green-500 font-bold'>réalisé</span>: l&apos;équipe remporte <strong>{round.rewardsPerQuestion} point</strong>, <strong>+{round.rewardsForBonus} point bonus</strong> si elle énonce encore plus de réponses qu&apos;annoncé.</li>
            <li>Le pari n&apos;est <span className='2xl:text-red-500 font-bold'>pas réalisé</span>: toutes les autres équipes remportent <strong>{round.rewardsPerQuestion} point</strong>.</li>
        </ul>
    </>
}

function MatchingRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>🖱️ Chaque équipe se relaie à son tour et <strong>clique sur les propositions </strong> du lien qu&apos;elle considère juste, <span className='font-bold underline'>de gauche à droite</span>.</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>Si le lien est <span className='2xl:text-green-500 font-bold'>correct</span>, on passe à l&apos;équipe suivante.</li>
            <li>Si le lien est <span className='2xl:text-red-500 font-bold'>incorrect</span>, l&apos;équipe obtient <strong>{round.mistakePenalty} point de pénalité.</strong></li>
        </ul>
        <p className='2xl:text-2xl text-center'>⚠️ <strong>Dans tous les cas, le lien est dessiné !</strong></p>
        <p className='2xl:text-2xl text-center'>⏳ Vous avez <u><strong>entre {MATCHING_THINKING_TIME * (MATCHING_MIN_NUM_COLS - 1)} et {MATCHING_THINKING_TIME * (MATCHING_MAX_NUM_COLS - 1)} secondes</strong></u> pour vous décider, faute de quoi <strong>un lien aléatoire sera dessiné !</strong></p>
        <p className='2xl:text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
    </>
}

function MCQRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center'>❓ Chaque question est attribuée à une équipe. L&apos;équipe a alors <strong>{MCQ_OPTIONS.length} options</strong> à sa disposition:</p>
        <ol className='2xl:text-2xl border-solid border-blue-500 border-2 p-2'>
            {MCQ_OPTIONS.map((option, index) => <li key={index}>{MCQ_OPTION_TO_ICON[option]} {mcqOptionToTitle(option, 'fr-FR')} ({round.rewardsPerQuestion[option]} pt{round.rewardsPerQuestion[option] > 1 && 's'})</li>)}
        </ol>
        <p className='2xl:text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
    </>
}

// Finale
function ThemesRoundRules({ round }) {
    return <>
        <p className='2xl:text-2xl text-center font-bold'>🗣️ Répondez directement aux questions, il n&apos;y a pas de proposition de réponses.</p>
        <p className='2xl:text-2xl text-center'>⚠️ Attention, il faut être précis dans sa réponse!</p>
        <p className='2xl:text-2xl text-center'>💜 Restez calme, ça va bien se passer.</p>
    </>
}