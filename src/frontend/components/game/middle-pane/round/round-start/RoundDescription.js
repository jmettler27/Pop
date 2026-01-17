import { BasicQuestion } from '@/backend/models/questions/Basic';
import { BlindtestQuestion } from '@/backend/models/questions/Blindtest';
import { EnumerationQuestion } from '@/backend/models/questions/Enumeration';
import { LabellingQuestion } from '@/backend/models/questions/Labelling';
import { MatchingQuestion } from '@/backend/models/questions/Matching';
import { MCQQuestion } from '@/backend/models/questions/MCQ';
import { OddOneOutQuestion } from '@/backend/models/questions/OddOneOut';
import {
  QuoteQuestion,
  QuotePartElement,
  QuoteAuthorElement,
  QuoteSourceElement,
} from '@/backend/models/questions/Quote';

import { RoundType } from '@/backend/models/rounds/RoundType';

export function RoundDescription({ round }) {
  switch (round.type) {
    case RoundType.BASIC:
      return <BasicRoundDescription />;
    case RoundType.BLINDTEST:
      return <BlindtestRoundDescription />;
    case RoundType.EMOJI:
      return <EmojiRoundDescription />;
    case RoundType.ENUMERATION:
      return <EnumerationRoundDescription />;
    case RoundType.IMAGE:
      return <ImageRoundDescription />;
    case RoundType.LABEL:
      return <LabellingRoundDescription />;
    case RoundType.MATCHING:
      return <MatchingRoundDescription />;
    case RoundType.MCQ:
      return <MCQRoundDescription />;
    case RoundType.MIXED:
      return <MixedRoundDescription />;
    case RoundType.NAGUI:
      return <NaguiRoundDescription />;
    case RoundType.ODD_ONE_OUT:
      return <OddOneOutRoundDescription />;
    case RoundType.PROGRESSIVE_CLUES:
      return <ProgressiveCluesRoundDescription />;
    case RoundType.QUOTE:
      return <QuoteRoundDescription />;
    case RoundType.SPECIAL:
      return <SpecialRoundDescription />;
    default:
      return <></>;
  }
}

function BasicRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🔀 Plusieurs questions directes sur des sujets différents, dans un <strong>ordre aléatoire.</strong>
      </p>
    </>
  );
}

function BlindtestRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        👂 Écoutez la musique ({BlindtestQuestion.typeToEmoji(BlindtestQuestion.TYPE_SONG)}) ou le son (
        {BlindtestQuestion.typeToEmoji(BlindtestQuestion.TYPE_SOUND)}), et répondez à la question.
      </p>
      <br></br>
      <p className="2xl:text-2xl text-center">
        🎚️ Des contrôles vous permettent de <strong>régler le volume</strong> et d&apos;
        <strong>avancer ou reculer dans la timeline</strong>.
      </p>
    </>
  );
}

function EmojiRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🧐 Trouvez l&apos;œuvre ou le lieu/personnage/objet/... qui se cache derrière chaque combinaison d&apos;emojis.
      </p>
      <br></br>
      <p className="2xl:text-2xl text-center">
        🧩 Cette combinaison peut évoquer les <strong>idées générales</strong>, ou il peut s&apos;agir juste d&apos;un{' '}
        <strong>rébus</strong>, ça dépend.
      </p>
    </>
  );
}

function EnumerationRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">💬 Citez-nous le plus d&apos;éléments qui répondent à la question.</p>
    </>
  );
}

function ImageRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🧐 Trouvez l&apos;œuvre ou le lieu/personnage/objet/... qui se cache derrière chaque image.
      </p>
    </>
  );
}

function LabellingRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">Chaque question consiste en une image et des pastilles numérotées</p>
      <br />
      <p className="2xl:text-2xl text-center">🫣 A vous de retrouver les étiquettes correspondant aux pastilles.</p>
      <br />
      <p className="2xl:text-2xl text-center">
        👁️ En cas de blocage, les organisateurs peuvent vous <strong>révéler un élément</strong>.
      </p>
    </>
  );
}

function MatchingRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🔀 Une grille, organisée en{' '}
        <strong>
          {MatchingQuestion.MIN_NUM_COLS} à {MatchingQuestion.MAX_NUM_COLS}
        </strong>{' '}
        colonnes de propositions affichées dans un ordre aléatoire, et entre lesquelles il existe des liens.
      </p>
      <p className="2xl:text-2xl text-center">🔗 Le but est de trouver les bonnes associations.</p>
    </>
  );
}

function MixedRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🔀 Plusieurs questions de <strong>types différents</strong>.
      </p>
    </>
  );
}

function MCQRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🔀 Plusieurs questions directes sur des sujets différents, dans un <strong>ordre aléatoire.</strong>
      </p>
    </>
  );
}

function NaguiRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🔀 Plusieurs questions directes sur des sujets différents, dans un <strong>ordre aléatoire.</strong>
      </p>
    </>
  );
}

function OddOneOutRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🔀 Une liste de <strong>{OddOneOutQuestion.MAX_NUM_ITEMS} propositions</strong>, affichée dans un{' '}
        <strong>ordre aléatoire</strong> pour chaque participant.
      </p>
      <br />
      <p className="2xl:text-2xl text-center">
        <span className="text-green-500">Toutes vraies</span>, <span className="font-bold text-red-500">sauf une!</span>
      </p>
      <br />
      <p className="2xl:text-2xl text-center">
        Si vous connaissez l&apos;intrus, <strong>gardez-le secret</strong>... 🤫
      </p>
    </>
  );
}

function ProgressiveCluesRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        🕵️‍♂️ Une <strong>liste d&apos;indices</strong> vous est dévoilée progressivement...
      </p>
      <br></br>
      <p className="2xl:text-2xl text-center">
        🧠 <strong>Fouillez dans votre mémoire</strong> et devinez l&apos;œuvre/la personne/... qui se cache derrière
        ces indices.
      </p>
    </>
  );
}

function QuoteRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">Chaque question consiste en</p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          {QuotePartElement.elementToEmoji()} Une <strong>réplique</strong>
        </li>
        <li>
          {QuoteAuthorElement.elementToEmoji()} La <strong>personne</strong> qui l&apos;a prononcée
        </li>
        <li>
          {QuoteSourceElement.elementToEmoji()} L&apos;<strong>œuvre</strong> dont elle est issue
        </li>
      </ul>
      <br />
      <p className="2xl:text-2xl text-center">
        🫣 <strong>Un, deux ou trois</strong> de ces éléments sont <strong>cachés</strong>: à vous de les retrouver.
      </p>
      <br />
      <p className="2xl:text-2xl text-center">
        👁️ En cas de blocage, les organisateurs peuvent vous <strong>révéler un élément</strong>.
      </p>
    </>
  );
}

function SpecialRoundDescription({}) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        <strong>25 questions</strong> organisées en <strong>5 niveaux</strong>.
      </p>
    </>
  );
}
