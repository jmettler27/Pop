import { numberToKeycapEmoji } from '@/backend/utils/emojis';

import { RoundType } from '@/backend/models/rounds/RoundType';
import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import fmt, { keyChunks } from '@/utils/fmt';

const messages = defineMessages('frontend.game.round.RoundCompletionRatePolicy', {
  maxPoints: 'Max points / team: <b>{points}</b>',
  pointsPerCorrectAnswer: '✨ <correct>{points} point per correct answer</correct>',
  pointsPerElementFound: '✨ <correct>{points} point per correct element found</correct>',
  pointsPerLabelFound: '✨ <correct>{points} point per correct label found</correct>',
  oddOneOutPenalty:
    '✨ Selecting an incorrect proposal = <incorrect>{penalty} point(s) on the global score</incorrect>',
  matchingPenalty: '✨ Drawing an incorrect link = <incorrect>{penalty} point(s) on the global score</incorrect>',
  naguiTitle: '✨ A <b>variable number of points</b> per correct answer',
  specialTitle: '😨 Your <b>accumulated points</b> so far = your <b>number of mistake allowances</b>',
  specialOrder: 'Turn order = {order}.',
  specialOrderRandom: 'random order',
  specialOrderRanking: 'reverse ranking from round {roundNumber}',
});

const b = (chunks) => <strong>{keyChunks(chunks)}</strong>;
const correct = (chunks) => <span className="text-green-500 font-bold">{keyChunks(chunks)}</span>;
const incorrect = (chunks) => <span className="text-red-500 font-bold">{keyChunks(chunks)}</span>;
const richTags = { b, correct, incorrect };

export function RoundCompletionRatePolicy({ round }) {
  return (
    <div className="flex flex-col items-center justify-start space-y-4 p-2">
      <RoundCompletionRatePolicyTitle round={round} />
      <div className="flex flex-col items-center justify-start">
        <RoundMaxNumPoints round={round} />
      </div>
    </div>
  );
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
      return <BuzzerRoundCompletionRatePolicyTitle round={round} />;
    case RoundType.LABELLING:
      return <LabellingRoundCompletionRatePolicyTitle round={round} />;
    case RoundType.MATCHING:
      return <MatchingRoundCompletionRatePolicyTitle round={round} />;
    case RoundType.NAGUI:
      return <NaguiRoundCompletionRatePolicyTitle />;
    case RoundType.ODD_ONE_OUT:
      return <OddOneOutRoundCompletionRatePolicyTitle round={round} />;
    case RoundType.QUOTE:
      return <QuoteRoundCompletionRatePolicyTitle round={round} />;
    default:
      return <></>;
  }
}

function RoundMaxNumPoints({ round }) {
  const { formatMessage } = useIntl();
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
      return (
        <h1 className="2xl:text-3xl text-center">
          {fmt(formatMessage, messages.maxPoints, { points: numberToKeycapEmoji(round.maxPoints), ...richTags })}
        </h1>
      );
    default:
      return <></>;
  }
}

function BuzzerRoundCompletionRatePolicyTitle({ round }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl text-center">
      {fmt(formatMessage, messages.pointsPerCorrectAnswer, { points: round.rewardsPerQuestion, ...richTags })}
    </h1>
  );
}

function QuoteRoundCompletionRatePolicyTitle({ round }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl text-center">
      {fmt(formatMessage, messages.pointsPerElementFound, { points: round.rewardsPerElement, ...richTags })}
    </h1>
  );
}

function LabellingRoundCompletionRatePolicyTitle({ round }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl text-center">
      {fmt(formatMessage, messages.pointsPerLabelFound, { points: round.rewardsPerElement, ...richTags })}
    </h1>
  );
}

function OddOneOutRoundCompletionRatePolicyTitle({ round }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-2xl text-center">
      {fmt(formatMessage, messages.oddOneOutPenalty, { penalty: round.mistakePenalty, ...richTags })}
    </h1>
  );
}

function MatchingRoundCompletionRatePolicyTitle({ round }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-2xl text-center">
      {fmt(formatMessage, messages.matchingPenalty, { penalty: round.mistakePenalty, ...richTags })}
    </h1>
  );
}

function NaguiRoundCompletionRatePolicyTitle() {
  const { formatMessage } = useIntl();
  return <h1 className="2xl:text-3xl text-center">{fmt(formatMessage, messages.naguiTitle, richTags)}</h1>;
}

export function SpecialRoundCompletionRatePolicy({ round }) {
  const { formatMessage } = useIntl();
  const orderText =
    round.order > 0
      ? formatMessage(messages.specialOrderRanking, { roundNumber: round.order })
      : formatMessage(messages.specialOrderRandom);
  return (
    <div className="flex flex-col items-center justify-start space-y-4">
      <h1 className="2xl:text-3xl text-center">{fmt(formatMessage, messages.specialTitle, richTags)}</h1>
      <div className="flex flex-col items-center justify-start">
        <p className="2xl:text-2xl text-center">{formatMessage(messages.specialOrder, { order: orderText })}</p>
      </div>
    </div>
  );
}
