import { RoundType } from '@/backend/models/rounds/RoundType';
import { BasicQuestion } from '@/backend/models/questions/Basic';
import { BlindtestQuestion } from '@/backend/models/questions/Blindtest';
import { EmojiQuestion } from '@/backend/models/questions/Emoji';
import { EnumerationQuestion } from '@/backend/models/questions/Enumeration';
import { ImageQuestion } from '@/backend/models/questions/Image';
import { LabellingQuestion } from '@/backend/models/questions/Labelling';
import { MatchingQuestion } from '@/backend/models/questions/Matching';
import { MCQQuestion } from '@/backend/models/questions/MCQ';
import { NaguiQuestion } from '@/backend/models/questions/Nagui';
import { OddOneOutQuestion } from '@/backend/models/questions/OddOneOut';
import { ProgressiveCluesQuestion } from '@/backend/models/questions/ProgressiveClues';
import { QuoteQuestion } from '@/backend/models/questions/Quote';

export function RoundRules({ round }) {
  switch (round.type) {
    case RoundType.BASIC:
      return <BasicRoundRules round={round} />;
    case RoundType.BLINDTEST:
      return <BlindtestRoundRules round={round} />;
    case RoundType.EMOJI:
      return <EmojiRoundRules round={round} />;
    case RoundType.ENUMERATION:
      return <EnumRoundRules round={round} />;
    case RoundType.IMAGE:
      return <ImageRoundRules round={round} />;
    case RoundType.LABELLING:
      return <LabellingRoundRules round={round} />;
    case RoundType.MATCHING:
      return <MatchingRoundRules round={round} />;
    case RoundType.MCQ:
      return <MCQRoundRules round={round} />;
    case RoundType.MIXED:
      return <MixedRoundRules round={round} />;
    case RoundType.NAGUI:
      return <NaguiRoundRules round={round} />;
    case RoundType.ODD_ONE_OUT:
      return <OddOneOutRoundRules round={round} />;
    case RoundType.PROGRESSIVE_CLUES:
      return <ProgressiveCluesRoundRules round={round} />;
    case RoundType.QUOTE:
      return <QuoteRoundRules round={round} />;
    case RoundType.SPECIAL:
      return <SpecialRoundRules round={round} />;
  }
}

function ProgressiveCluesRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        💡 Dès que vous avez une idée, <span className="font-bold text-red-500">buzzez</span> en{' '}
        <strong>cliquant sur &quot;Buzz&quot;</strong>. Vous pouvez{' '}
        <span className="font-bold text-blue-400">annuler votre buzz</span> en{' '}
        <strong>cliquant sur &quot;Annuler&quot;</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.
      </p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Si votre réponse est <span className="text-green-500 font-bold">correcte</span>, vous gagnez{' '}
          <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.
        </li>
        <li>
          Si votre réponse est <span className="text-red-500 font-bold">incorrecte</span>, votre essai est invalidé et
          on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un. De plus,{' '}
          <strong>votre buzzer est désactivé jusqu&apos;à l&apos;indice i + {round.delay}</strong>.
        </li>
      </ul>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{ProgressiveCluesQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour répondre, faute de quoi votre essai sera invalidé !
      </p>
      <p className="2xl:text-2xl text-center">
        ⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.
      </p>
    </>
  );
}

function EmojiRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        💡 Dès que vous avez une idée, <span className="font-bold text-red-500">buzzez</span> en{' '}
        <strong>cliquant sur &quot;Buzz&quot;</strong>. Vous pouvez{' '}
        <span className="font-bold text-blue-400">annuler votre buzz</span> en{' '}
        <strong>cliquant sur &quot;Annuler&quot;</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.
      </p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Si votre réponse est <span className="text-green-500 font-bold">correcte</span>, vous gagnez{' '}
          <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.
        </li>
        <li>
          Si votre réponse est <span className="text-red-500 font-bold">incorrecte</span>, votre essai est invalidé et
          on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un.
        </li>
      </ul>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{EmojiQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour répondre, faute de quoi votre essai sera invalidé !
      </p>
      <p className="2xl:text-2xl text-center">
        ⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.
      </p>
    </>
  );
}

function ImageRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        💡 Dès que vous avez une idée, <span className="font-bold text-red-500">buzzez</span> en{' '}
        <strong>cliquant sur &quot;Buzz&quot;</strong>. Vous pouvez{' '}
        <span className="font-bold text-blue-400">annuler votre buzz</span> en{' '}
        <strong>cliquant sur &quot;Annuler&quot;</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.
      </p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Si votre réponse est <span className="text-green-500 font-bold">correcte</span>, vous gagnez{' '}
          <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.
        </li>
        <li>
          Si votre réponse est <span className="text-red-500 font-bold">incorrecte</span>, votre essai est invalidé et
          on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un.
        </li>
      </ul>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{ImageQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour répondre, faute de quoi votre essai sera invalidé !
      </p>
      <p className="2xl:text-2xl text-center">
        ⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.
      </p>
    </>
  );
}

function BlindtestRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        💡 Dès que vous avez une idée, <span className="font-bold text-red-500">buzzez</span> en{' '}
        <strong>cliquant sur &quot;Buzz&quot;</strong>. Vous pouvez{' '}
        <span className="font-bold text-blue-400">annuler votre buzz</span> en{' '}
        <strong>cliquant sur &quot;Annuler&quot;</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.
      </p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Si votre réponse est <span className="text-green-500 font-bold">correcte</span>, vous gagnez{' '}
          <strong>{round.rewardsPerQuestion} point</strong> et la question se termine.
        </li>
        <li>
          Si votre réponse est <span className="text-red-500 font-bold">incorrecte</span>, votre essai est invalidé et
          on passe au prochain joueur dans la file d&apos;attente, s&apos;il y en a un.
        </li>
      </ul>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{BlindtestQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour répondre, faute de quoi votre essai sera invalidé !
      </p>
      <p className="2xl:text-2xl text-center">
        ⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.
      </p>
    </>
  );
}

function QuoteRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        💡 Dès que vous avez une idée, <span className="font-bold text-red-500">buzzez</span> en{' '}
        <strong>cliquant sur &quot;Buzz&quot;</strong>. Vous pouvez{' '}
        <span className="font-bold text-blue-400">annuler votre buzz</span> en{' '}
        <strong>cliquant sur &quot;Annuler&quot;</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.
      </p>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{QuoteQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour répondre, faute de quoi votre essai sera invalidé !
      </p>
      <p className="2xl:text-2xl text-center">
        ⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        😈 Vous pouvez gagner des points <strong>même si vous ne connaissez pas tous les éléments !</strong>
      </p>
    </>
  );
}

function LabellingRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        💡 Dès que vous avez une idée, <span className="font-bold text-red-500">buzzez</span> en{' '}
        <strong>cliquant sur &quot;Buzz&quot;</strong>. Vous pouvez{' '}
        <span className="font-bold text-blue-400">annuler votre buzz</span> en{' '}
        <strong>cliquant sur &quot;Annuler&quot;</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        🥇 Si vous êtes en tête de la file d&apos;attente, proposez votre réponse à l&apos;oral.
      </p>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{LabellingQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour répondre, faute de quoi votre essai sera invalidé !
      </p>
      <p className="2xl:text-2xl text-center">
        ⚠️ Vous disposez de <strong>{round.maxTries} essais par question</strong>.
      </p>
      <p className="2xl:text-2xl text-center">
        😈 Vous pouvez gagner des points <strong>même si vous ne connaissez pas tous les éléments !</strong>
      </p>
    </>
  );
}

function OddOneOutRoundRules({ round }) {
  const { order, mistakePenalty } = round;

  return (
    <>
      <p className="2xl:text-2xl text-center">
        🖱️ Chaque équipe se relaie à son tour et{' '}
        <strong>clique sur une proposition de la liste qu&apos;elle considère juste</strong>.
      </p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Si la proposition est <span className="text-green-500 font-bold">correcte</span>, on passe à l&apos;équipe
          suivante.
        </li>
        <li>
          Si la proposition est <span className="text-red-500 font-bold">incorrecte</span>, on termine la question et
          l&apos;équipe obtient{' '}
          <strong>
            {mistakePenalty} point{Math.abs(mistakePenalty) > 1 ? 's' : ''} de pénalité.
          </strong>{' '}
          De plus, elle devient <strong>1ère dans l&apos;ordre de passage de la question suivante</strong>.
        </li>
      </ul>
      <p className="2xl:text-2xl text-center">
        ℹ️ Une petite <strong>explication</strong> est affichée à chaque fois.
      </p>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{OddOneOutQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour vous décider, faute de quoi <strong>une proposition sera choisie aléatoirement dans la liste !</strong>
      </p>
      <p className="2xl:text-2xl text-center">
        L&apos;ordre de passage = {order > 0 ? `Le classement inversé de la manche ${order}` : 'Un ordre aléatoire'}.
      </p>
    </>
  );
}

function EnumRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        La question se déroule en <strong>deux temps</strong> :
      </p>
      <ol className="2xl:text-2xl list-decimal pl-10">
        <li>
          🤔 Une phase de <strong>réflexion</strong> durant laquelle les équipes choisissent leur pari.
        </li>
        <li>
          🗣️ Une phase de <strong>réponse</strong> durant laquelle l&apos;équipe qui a donné le plus gros pari énonce
          ses réponses.{' '}
        </li>
      </ol>
      <p className="2xl:text-2xl">Il y a alors deux issues possibles :</p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Le pari est <span className="text-green-500 font-bold">réalisé</span>: l&apos;équipe remporte{' '}
          <strong>{round.rewardsPerQuestion} point</strong>, <strong>+{round.rewardsForBonus} point bonus</strong> si
          elle énonce encore plus de réponses qu&apos;annoncé.
        </li>
        <li>
          Le pari n&apos;est <span className="text-red-500 font-bold">pas réalisé</span>: toutes les autres équipes
          remportent <strong>{round.rewardsPerQuestion} point</strong>.
        </li>
      </ul>
    </>
  );
}

function MatchingRoundRules({ round }) {
  const { order, mistakePenalty, maxMistakes } = round;

  return (
    <>
      <p className="2xl:text-2xl text-center">
        🖱️ Chaque équipe se relaie à son tour et <strong>clique sur les propositions </strong> du lien qu&apos;elle
        considère juste, <span className="font-bold underline">de gauche à droite</span>.
      </p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Si le lien est <span className="text-green-500 font-bold">correct</span>, on passe à l&apos;équipe suivante.
        </li>
        <li>
          Si le lien est <span className="text-red-500 font-bold">incorrect</span>, l&apos;équipe obtient{' '}
          <strong>
            {mistakePenalty} point{Math.abs(mistakePenalty) > 1 ? 's' : ''} de pénalité.
          </strong>
        </li>
      </ul>
      <p className="2xl:text-2xl text-center">
        ⚠️ <strong>Dans tous les cas, le lien est dessiné !</strong>
      </p>
      <p className="2xl:text-2xl text-center">
        🙅 L&apos;équipe est <strong>disqualifiée</strong> de la question au bout de{' '}
        <strong>{maxMistakes || MatchingQuestion.MAX_NUM_MISTAKES} erreurs</strong>, et la question s&apos;arrête si
        toutes les équipes sont disqualifiées.
      </p>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>
            entre {MatchingQuestion.THINKING_TIME * (MatchingQuestion.MIN_NUM_COLS - 1)} et{' '}
            {MatchingQuestion.THINKING_TIME * (MatchingQuestion.MAX_NUM_COLS - 1)} secondes
          </strong>
        </u>{' '}
        pour vous décider, faute de quoi <strong>un lien aléatoire sera dessiné !</strong>
      </p>
      <p className="2xl:text-2xl text-center">
        L&apos;ordre de passage = {order > 0 ? `Le classement inversé de la manche ${order}` : 'Un ordre aléatoire'}.
      </p>
    </>
  );
}

function MCQRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        ❓ Chaque question est attribuée à une équipe. L&apos;équipe a alors plusieurs choix de réponses.
      </p>
      <p className="2xl:text-2xl text-center">
        L&apos;ordre de passage ={' '}
        {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.
      </p>
    </>
  );
}

function NaguiRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        ❓ Chaque question est attribuée à une équipe. L&apos;équipe a alors{' '}
        <strong>{NaguiQuestion.OPTIONS.length} options</strong> à sa disposition:
      </p>
      <ol className="2xl:text-2xl border-solid border-blue-500 border-2 p-2">
        {NaguiQuestion.OPTIONS.map((option, index) => (
          <li key={index}>
            {NaguiQuestion.typeToEmoji(option)} {NaguiQuestion.typeToTitle(option, 'fr-FR')} (
            {round.rewardsPerQuestion[option]} pt{round.rewardsPerQuestion[option] > 1 && 's'})
          </li>
        ))}
      </ol>
      <p className="2xl:text-2xl text-center">
        L&apos;ordre de passage ={' '}
        {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.
      </p>
    </>
  );
}

function BasicRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">
        ❓ Chaque question est attribuée à une équipe, qui doit proposer sa réponse à l&apos;oral.
      </p>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          Si votre réponse est <span className="text-green-500 font-bold">correcte</span>, vous gagnez{' '}
          <strong>{round.rewardsPerQuestion} point</strong>.
        </li>
        <li>
          Si votre réponse est <span className="text-red-500 font-bold">incorrecte</span>, vous n&apos;obtenez aucun
          point.
        </li>
      </ul>
      <p className="2xl:text-2xl text-center">
        ⏳ Vous avez{' '}
        <u>
          <strong>{BasicQuestion.THINKING_TIME} secondes</strong>
        </u>{' '}
        pour répondre, faute de quoi votre essai sera invalidé !
      </p>
      <p className="2xl:text-2xl text-center">
        L&apos;ordre de passage ={' '}
        {round.order > 0 ? `Le classement inversé de la manche ${round.order}` : 'Un ordre aléatoire'}.
      </p>
    </>
  );
}

function SpecialRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center font-bold">
        🗣️ Répondez directement aux questions, il n&apos;y a pas de proposition de réponses.
      </p>
      <p className="2xl:text-2xl text-center">⚠️ Attention, il faut être précis dans sa réponse!</p>
      <p className="2xl:text-2xl text-center">💜 Restez calme, ça va bien se passer.</p>
    </>
  );
}

function MixedRoundRules({ round }) {
  return (
    <>
      <p className="2xl:text-2xl text-center">Les règles dépendent du type de la question.</p>
    </>
  );
}
