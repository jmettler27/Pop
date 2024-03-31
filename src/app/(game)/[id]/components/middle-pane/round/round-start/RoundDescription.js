import { mcqOptionToTitle, MCQ_OPTIONS, MCQ_OPTION_TO_ICON } from '@/lib/utils/question/mcq'
import { OOO_ITEMS_LENGTH } from '@/lib/utils/question/odd_one_out'
import { MATCHING_MAX_NUM_COLS, MATCHING_MIN_NUM_COLS } from '@/lib/utils/question/matching'
import { quoteElementToEmoji } from '@/lib/utils/question/quote'

export function RoundDescription({ round }) {
    switch (round.type) {
        case 'progressive_clues':
            return <ProgressiveCluesRoundDescription round={round} />
        case 'image':
            return <ImageRoundDescription round={round} />
        case 'blindtest':
            return <BlindtestRoundDescription round={round} />
        case 'emoji':
            return <EmojiRoundDescription round={round} />
        case 'quote':
            return <QuoteRoundDescription round={round} />
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
        <p className='text-2xl text-center'>🎧 Écoutez la musique ou le son, et répondez à la question.</p>
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


function QuoteRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>Chaque question consiste en</p>
        <ul className='text-2xl list-disc pl-10'>
            <li>{quoteElementToEmoji('quote')} Une <strong>réplique</strong></li>
            <li>{quoteElementToEmoji('author')} La <strong>personne</strong> qui l&apos;a prononcée</li>
            <li>{quoteElementToEmoji('source')} L&apos;<strong>œuvre</strong> dont elle est issue</li>
        </ul>
        <br />
        <p className='text-2xl text-center'>🫣 <strong>Un, deux ou trois</strong> de ces éléments sont <strong>cachés</strong>: à vous de les retrouver.</p>
        <br />
        <p className='text-2xl text-center'>👁️ En cas de blocage, les organisateurs peuvent vous <strong>révéler un élément</strong>.</p>
    </>
}

function OddOneOutRoundDescription({ round }) {
    return <>
        <p className='text-2xl text-center'>🔀 Une liste de <strong>{OOO_ITEMS_LENGTH} propositions</strong>, affichée dans un <strong>ordre aléatoire</strong> pour chaque participant.</p>
        <br />
        <p className='text-2xl text-center'><span className='text-green-500'>Toutes vraies</span>, <span className='font-bold text-red-500'>sauf une!</span></p>
        <br />
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