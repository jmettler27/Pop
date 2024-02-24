import { useGameContext } from '@/app/(game)/contexts'

import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { collection, doc } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'

import LoadingScreen from '@/app/components/LoadingScreen'
import { rankingToEmoji, numberToKeycapEmoji } from '@/lib/utils/emojis'

import { mcqOptionToTitle, MCQ_OPTIONS, MCQ_OPTION_TO_ICON } from '@/lib/utils/question/mcq'
import { OOO_ITEMS_LENGTH } from '@/lib/utils/question/odd_one_out'
import { MATCHING_MAX_NUM_COLS, MATCHING_MIN_NUM_COLS } from '@/lib/utils/question/matching'

export default function RoundStartBody({ round }) {
    return (
        <div className='flex flex-row justify-around w-full h-full p-10 [&>*]:'>

            {/* General principle + Number of questions */}
            <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>
                <RoundGeneralInfo round={round} />
            </div>

            {/* Additional Remarks */}
            <div className='border-dashed border-4 p-2 w-[30%] h-full overflow-auto'>
                <div className='flex flex-col items-center justify-start space-y-4'>
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
    return (
        <div className='flex flex-col items-center justify-start'>
            {round.type === 'finale' ?
                <h1 className='text-3xl mb-4 font-bold'>{<FinaleNumThemes round={round} />} thèmes</h1> :
                <h1 className='text-3xl mb-4 font-bold'>{numberToKeycapEmoji(round.questions.length)} questions</h1>
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


function RoundDescription({ round }) {
    switch (round.type) {
        case 'progressive_clues':
            return <ProgressiveCluesRoundDescription round={round} />
        case 'image':
            return <ImageRoundDescription round={round} />
        case 'blindtest':
            return <BlindtestRoundDescription round={round} />
        case 'emoji':
            return <EmojiRoundDescription round={round} />
        case 'odd_one_out':
            return <OddOneOutRoundDescription round={round} />
        case 'enum':
            return <EnumRoundDescription round={round} />
        case 'matching':
            return <MatchingRoundDescription round={round} />
        case 'mcq':
            return <MCQRoundDescription round={round} />
        case 'finale':
            return <ThemesRoundDescription round={round} />
        default:
            return <></>
    }
}

function ProgressiveCluesRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'><strong>🕵️‍♂️ Plusieurs indices</strong> par question, de plus en plus évidents.</p>
        <br></br>
        <p className='text-2xl text-center'>🧠 <strong>Fouillez dans votre mémoire</strong> et devinez l&apos;œuvre/la personne/... qui se cachent derrière.</p>
    </>
}

function ImageRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>🧐 Trouvez l&apos;œuvre ainsi que le lieu/personnage/objet/... qui se cachent derrière chaque image.</p>
    </>
}

function BlindtestRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>🎧 Écoutez la musique, et devinez l&apos;œuvre dont elle est issue.</p>
        <br></br>
        <p className='text-2xl text-center'>🎚️ Des contrôles vous permettent de <strong>régler le volume</strong> et d&apos;<strong>avancer dans la timeline</strong>.</p>
    </>
}

function EmojiRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>🧐 Devinez l&apos;œuvre ainsi que le lieu/personnage/objet/... qui se cachent derrière chaque combinaison d&apos;emojis.</p>
        <br></br>
        <p className='text-2xl text-center'>🧩 Cette combinaison peut évoquer les <strong>idées générales</strong>, ou il peut s&apos;agir juste d&apos;un <strong>rébus</strong>, ça dépend.</p>
    </>
}

function OddOneOutRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>Une liste de <strong>{OOO_ITEMS_LENGTH} propositions</strong></p>
        <p className='text-2xl text-center'><span className='text-green-500'>Toutes vraies</span>, <span className='font-bold text-red-500'>sauf une!</span></p>
        <p className='text-2xl text-center'>Si vous connaissez l&apos;intrus, <strong>gardez-le secret</strong>... 🤫</p>
    </>
}

function EnumRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>💬 Citez-nous le plus d&apos;éléments qui répondent à la question.</p>
    </>
}

function MatchingRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>🔗 Chaque question consiste en <strong>{MATCHING_MIN_NUM_COLS} à {MATCHING_MAX_NUM_COLS}</strong> colonnes de propositions, entre lesquelles il existe des liens.</p>
        <p className='text-2xl text-center'>Le but est de trouver les bonnes associations.</p>
    </>
}

function MCQRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>🔀 Plusieurs questions directes sur des sujets différents, dans un <strong>ordre aléatoire.</strong></p>
    </>
}

function ThemesRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'><strong>25 questions</strong> organisées en <strong>5 niveaux</strong>.</p>
    </>
}



/* ============================================================== Round Rules ============================================================== */
function RoundRules({ round }) {
    switch (round.type) {
        case 'progressive_clues':
            return <ProgressiveCluesRoundRules round={round} />
        case 'emoji':
            return <EmojiRoundRules round={round} />
        case 'image':
            return <ImageRoundRules round={round} />
        case 'blindtest':
            return <BlindtestRoundRules round={round} />
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

function RiddleRoundRules({ round }) {

}

function ProgressiveCluesRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur le bouton</strong> avec la <strong>souris</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur le bouton &quot;Annuler&quot;</strong>.</p>
        <p className='text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente (e.g., vous avez buzzé en premier) proposez votre réponse à l&apos;oral.</p>
        <p className='text-2xl text-center'>❌ Si vous répondez mal, vous ne pourrez répondre qu&apos;après <strong>{round.delay}</strong> indices.</p>
        <p className='text-2xl text-center'>⚠️ Vous avez <strong>maximum {round.maxTries} essais par question</strong> !</p>
    </>
}

function EmojiRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur le bouton</strong> avec la <strong>souris</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur le bouton &quot;Annuler&quot;</strong>.</p>
        <p className='text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente (e.g., vous avez buzzé en premier) proposez votre réponse à l&apos;oral.</p>
        <p className='text-2xl text-center'>Pas besoin d&apos;être ultra précis. Si vous avez compris l&apos;idée, ça devrait aller.</p>
    </>
}

function ImageRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur le bouton</strong> avec la <strong>souris</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur le bouton &quot;Annuler&quot;</strong>.</p>
        <p className='text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente (e.g., vous avez buzzé en premier) proposez votre réponse à l&apos;oral.</p>
        <p className='text-2xl text-center'>Pas besoin d&apos;être ultra précis. Si vous avez compris l&apos;idée, ça devrait aller.</p>
    </>
}

function BlindtestRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>💡 Dès que vous avez une idée, <span className='font-bold text-red-500'>buzzez</span> en <strong>cliquant sur le bouton</strong> avec la <strong>souris</strong>.
            Vous pouvez <span className='font-bold text-blue-400'>annuler votre buzz</span> en <strong>cliquant sur le bouton &quot;Annuler&quot;</strong>.</p>
        <p className='text-2xl text-center'>🥇 Si vous êtes en tête de la file d&apos;attente (e.g., vous avez buzzé en premier) proposez votre réponse à l&apos;oral.</p>
        <p className='text-2xl text-center'>Pas besoin d&apos;être ultra précis. Si vous avez compris l&apos;idée, ça devrait aller.</p>
    </>
}

function OddOneOutRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>🖱️ Chaque équipe se relaie à son tour et <strong>clique sur une proposition de la liste qu&apos;elle considère juste</strong>.</p>
        <ul className='text-2xl list-disc pl-10'>
            <li>Si la proposition est <span className='text-green-500 font-bold'>vraie</span>, on passe à l&apos;équipe suivante.</li>
            <li>Si la proposition est <span className='text-red-500 font-bold'>fausse</span>, on termine la question et l&apos;équipe gagne <strong>{round.rewardsPerQuestion} point.</strong></li>
        </ul>
        <p className='text-2xl text-center'>ℹ️ Une petite <strong>explication</strong> est affichée à chaque fois.</p>
        <p className='text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
    </>
}

function EnumRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>La question se déroule en <strong>deux temps</strong> :</p>
        <ol className='text-2xl list-decimal pl-10'>
            <li>🤔 Une phase de <strong>réflexion</strong> durant laquelle les équipes choisissent leur pari.</li>
            <li>🗣️ Une phase de <strong>réponse</strong> durant laquelle l&apos;équipe qui a donné le plus gros pari énonce ses réponses. </li>
        </ol>
        <p className='text-2xl'>Il y a alors deux issues possibles :</p>
        <ul className='text-2xl list-disc pl-10'>
            <li>Le pari est <span className='text-green-500 font-bold'>réalisé</span>: l&apos;équipe remporte <strong>{round.rewardsPerQuestion} point</strong>, <strong>+{round.rewardsForBonus} point bonus</strong> si elle énonce encore plus de réponses qu&apos;annoncé.</li>
            <li>Le pari n&apos;est <span className='text-red-500 font-bold'>pas réalisé</span>: toutes les autres équipes remportent <strong>{round.rewardsPerQuestion} point</strong>.</li>
        </ul>
    </>
}

function MatchingRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>🖱️ Chaque équipe se relaie à son tour et <strong>clique sur les noeuds (ou plus simplement les propositions elles-mêmes)</strong> du lien qu&apos;elle considère juste, <span className='font-bold underline'>de gauche à droite</span>.</p>
        <ul className='text-2xl list-disc pl-10'>
            <li>Si le lien est <span className='text-green-500 font-bold'>juste</span>, on passe à l&apos;équipe suivante.</li>
            <li>Si le lien est <span className='text-red-500 font-bold'>faux</span>, l&apos;équipe &quot;gagne&quot; <strong>{round.rewardsPerQuestion} point.</strong></li>
        </ul>
        <p className='text-2xl text-center'>⚠️ <strong>Dans tous les cas, le lien est dessiné !</strong></p>
        <p className='text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
    </>
}

function MCQRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center'>❓ Chaque question est attribuée à une équipe. L&apos;équipe a alors <strong>{MCQ_OPTIONS.length} options</strong> à sa disposition:</p>
        <ol className='text-2xl border-solid border-blue-500 border-2 p-2'>
            {MCQ_OPTIONS.map((option, index) => <li key={index}>{MCQ_OPTION_TO_ICON[option]} {mcqOptionToTitle(option, 'fr-FR')} ({round.rewardsPerQuestion[option]} pt{round.rewardsPerQuestion[option] > 1 && 's'})</li>)}
        </ol>
        <p className='text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
    </>
}

// Finale
function ThemesRoundRules({ round }) {
    return <>
        <p className='text-2xl text-center font-bold'>🗣️ Répondez directement aux questions, il n&apos;y a pas de proposition de réponses.</p>
        <p className='text-2xl text-center'>⚠️ Attention, il faut être précis dans sa réponse!</p>
        <p className='text-2xl text-center'>💜 Restez calme, ça va bien se passer.</p>
    </>
}


/* ================================================================ Round Rewards ================================================================ */
function RoundRewards({ round }) {
    switch (round.type) {
        case 'finale':
            return <ThemesRoundRewards round={round} />
        default: return (
            <div className='flex flex-col items-center justify-start space-y-4'>
                <RoundRewardsTitle round={round} />
                <div className='flex flex-col items-center justify-start'>
                    <p className='text-2xl'>Le barème</p>
                    <ol className='text-2xl border-solid border-yellow-500 border-2 p-2'>
                        {round.rewards.map((reward, index) => {
                            return <li key={index}>{rankingToEmoji(index)} {reward} pts</li>
                        })}
                        {/* <li key={round.rewards.length - 1}>...  0 pts</li> */}
                    </ol>
                    <br></br>
                    <p className='text-2xl text-center'>où les équipes sont classées dans l&apos;ordre <strong>{(round.type === 'odd_one_out' || round.type === 'matching') ? "⚠️ croissant" : "décroissant"}</strong> du nombre de points gagnés.</p>
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
            return <RiddleRoundRewardsTitle round={round} />
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
    return <h1 className='text-3xl'><span className='font-bold'>{round.rewardsPerQuestion} point</span> par bonne réponse</h1>
}

function OddOneOutRoundRewardsTitle({ round }) {
    return <h1 className='text-3xl'><span className='font-bold'>{round.rewardsPerQuestion} point</span> par intrus trouvé</h1>
}

function MatchingRoundRewardsTitle({ round }) {
    return <h1 className='text-3xl'><span className='font-bold'>{round.mistakePenalty} point</span> par mauvais lien créé</h1>
}

function MCQRoundRewardsTitle({ round }) {
    return <>
        <h1 className='text-3xl text-center'>Un nombre variable de points par bonne réponse</h1>
    </>
}

function ThemesRoundRewards({ round }) {
    return (
        <div className='flex flex-col items-center justify-start space-y-4'>
            <h1 className='text-3xl text-center'>😨 Vos <strong>points accumulés</strong> jusqu&apos;à présent = votre <strong>nombre de droits à l&apos;erreur</strong></h1>
            <div className='flex flex-col items-center justify-start'>
                <p className='text-2xl text-center'>L&apos;ordre de passage = {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.</p>
            </div>
        </div>
    )
}