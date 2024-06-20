import { OOO_ITEMS_LENGTH } from '@/lib/utils/question/odd_one_out'
import { MATCHING_MAX_NUM_COLS, MATCHING_MIN_NUM_COLS } from '@/lib/utils/question/matching'
import { quoteElementToEmoji } from '@/lib/utils/question/quote'
import { blindtestTypeToEmoji } from '@/lib/utils/question/blindtest'

export function RoundDescription({ round }) {
    switch (round.type) {
        case 'progressive_clues':
            return <ProgressiveCluesRoundDescription />
        case 'image':
            return <ImageRoundDescription />
        case 'blindtest':
            return <BlindtestRoundDescription />
        case 'emoji':
            return <EmojiRoundDescription />
        case 'quote':
            return <QuoteRoundDescription />
        case 'odd_one_out':
            return <OddOneOutRoundDescription />
        case 'enum':
            return <EnumRoundDescription />
        case 'matching':
            return <MatchingRoundDescription />
        case 'mcq':
            return <MCQRoundDescription />
        case 'basic':
            return <BasicRoundDescription />
        case 'finale':
            return <ThemesRoundDescription />
        default:
            return <></>
    }
}

function ProgressiveCluesRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>🕵️‍♂️ Une <strong>liste d&apos;indices</strong> vous est dévoilée progressivement...</p>
        <br></br>
        <p className='2xl:text-2xl text-center'>🧠 <strong>Fouillez dans votre mémoire</strong> et devinez l&apos;œuvre/la personne/... qui se cache derrière ces indices.</p>
    </>
}

function ImageRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>🧐 Trouvez l&apos;œuvre ou le lieu/personnage/objet/... qui se cache derrière chaque image.</p>
    </>
}

function BlindtestRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>👂 Écoutez la musique ({blindtestTypeToEmoji('song')}) ou le son ({blindtestTypeToEmoji('sound')}), et répondez à la question.</p>
        <br></br>
        <p className='2xl:text-2xl text-center'>🎚️ Des contrôles vous permettent de <strong>régler le volume</strong> et d&apos;<strong>avancer ou reculer dans la timeline</strong>.</p>
    </>
}

function EmojiRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>🧐 Trouvez l&apos;œuvre ou le lieu/personnage/objet/... qui se cache derrière chaque combinaison d&apos;emojis.</p>
        <br></br>
        <p className='2xl:text-2xl text-center'>🧩 Cette combinaison peut évoquer les <strong>idées générales</strong>, ou il peut s&apos;agir juste d&apos;un <strong>rébus</strong>, ça dépend.</p>
    </>
}


function QuoteRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>Chaque question consiste en</p>
        <ul className='2xl:text-2xl list-disc pl-10'>
            <li>{quoteElementToEmoji('quote')} Une <strong>réplique</strong></li>
            <li>{quoteElementToEmoji('author')} La <strong>personne</strong> qui l&apos;a prononcée</li>
            <li>{quoteElementToEmoji('source')} L&apos;<strong>œuvre</strong> dont elle est issue</li>
        </ul>
        <br />
        <p className='2xl:text-2xl text-center'>🫣 <strong>Un, deux ou trois</strong> de ces éléments sont <strong>cachés</strong>: à vous de les retrouver.</p>
        <br />
        <p className='2xl:text-2xl text-center'>👁️ En cas de blocage, les organisateurs peuvent vous <strong>révéler un élément</strong>.</p>
    </>
}

function OddOneOutRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>🔀 Une liste de <strong>{OOO_ITEMS_LENGTH} propositions</strong>, affichée dans un <strong>ordre aléatoire</strong> pour chaque participant.</p>
        <br />
        <p className='2xl:text-2xl text-center'><span className='text-green-500'>Toutes vraies</span>, <span className='font-bold text-red-500'>sauf une!</span></p>
        <br />
        <p className='2xl:text-2xl text-center'>Si vous connaissez l&apos;intrus, <strong>gardez-le secret</strong>... 🤫</p>
    </>
}

function EnumRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>💬 Citez-nous le plus d&apos;éléments qui répondent à la question.</p>
    </>
}

function MatchingRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>🔀 Une grille, organisée en <strong>{MATCHING_MIN_NUM_COLS} à {MATCHING_MAX_NUM_COLS}</strong> colonnes de propositions affichées dans un ordre aléatoire, et entre lesquelles il existe des liens.</p>
        <p className='2xl:text-2xl text-center'>🔗 Le but est de trouver les bonnes associations.</p>
    </>
}

function MCQRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>🔀 Plusieurs questions directes sur des sujets différents, dans un <strong>ordre aléatoire.</strong></p>
    </>
}

function BasicRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'>🔀 Plusieurs questions directes sur des sujets différents, dans un <strong>ordre aléatoire.</strong></p>
    </>
}


function ThemesRoundDescription({ }) {
    return <>
        <p className='2xl:text-2xl text-center'><strong>25 questions</strong> organisées en <strong>5 niveaux</strong>.</p>
    </>
}