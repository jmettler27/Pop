'use client';

import { type ReactNode } from 'react';

import { useIntl } from 'react-intl';

import { numberToKeycapEmoji } from '@/frontend/helpers/emojis';
import fmt, { keyChunks } from '@/frontend/helpers/fmt';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';

const messages = defineMessages('frontend.game.round.RoundCompletionRatePolicy', {
  maxPoints: 'Max points / team: <b>{points}</b>',
  pointsPerCorrectAnswer: '✨ <correct>{points} point per correct answer</correct>',
  pointsPerElementFound: '✨ <correct>{points} point per correct element found</correct>',
  pointsPerLabelFound: '✨ <correct>{points} point per correct label found</correct>',
  oddOneOutPenalty:
    '✨ Selecting an incorrect proposal = <incorrect>{penalty} point(s) on the global score</incorrect>',
  matchingPenalty: '✨ Drawing an incorrect link = <incorrect>{penalty} point(s) on the global score</incorrect>',
  naguiTitle: '✨ A <b>variable number of points</b> per correct answer',
  pointsPerCorrectPosition: '✨ <correct>{points} point per item in correct position</correct>',
});

const b = (chunks: ReactNode[]) => <strong>{keyChunks(chunks)}</strong>;
const correct = (chunks: ReactNode[]) => <span className="text-green-500 font-bold">{keyChunks(chunks)}</span>;
const incorrect = (chunks: ReactNode[]) => <span className="text-red-500 font-bold">{keyChunks(chunks)}</span>;
const richTags = { b, correct, incorrect };

export function RoundCompletionRatePolicy({ round }: { round: AnyRound }) {
  return (
    <div className="flex flex-col items-center justify-start space-y-4 p-2">
      <RoundCompletionRatePolicyTitle round={round} />
      <div className="flex flex-col items-center justify-start">
        <RoundMaxNumPoints round={round} />
      </div>
    </div>
  );
}

function RoundCompletionRatePolicyTitle({ round }: { round: AnyRound }) {
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
    case RoundType.REORDERING:
      return <ReorderingRoundCompletionRatePolicyTitle round={round} />;
    default:
      return <></>;
  }
}

function RoundMaxNumPoints({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  switch (round.type) {
    case RoundType.BASIC:
    case RoundType.BLINDTEST:
    case RoundType.EMOJI:
    case RoundType.ENUMERATION:
    case RoundType.ESTIMATION:
    case RoundType.IMAGE:
    case RoundType.LABELLING:
    case RoundType.MCQ:
    case RoundType.NAGUI:
    case RoundType.PROGRESSIVE_CLUES:
    case RoundType.QUOTE:
    case RoundType.REORDERING:
      return (
        <h1 className="2xl:text-3xl text-center">
          {fmt(formatMessage, messages.maxPoints, {
            points: numberToKeycapEmoji((round as unknown as { maxPoints: number }).maxPoints),
            ...richTags,
          })}
        </h1>
      );
    default:
      return <></>;
  }
}

function BuzzerRoundCompletionRatePolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl text-center">
      {fmt(formatMessage, messages.pointsPerCorrectAnswer, {
        points: (round as unknown as { rewardsPerQuestion: number }).rewardsPerQuestion,
        ...richTags,
      })}
    </h1>
  );
}

function QuoteRoundCompletionRatePolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl text-center">
      {fmt(formatMessage, messages.pointsPerElementFound, {
        points: (round as unknown as { rewardsPerElement: number }).rewardsPerElement,
        ...richTags,
      })}
    </h1>
  );
}

function LabellingRoundCompletionRatePolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl text-center">
      {fmt(formatMessage, messages.pointsPerLabelFound, {
        points: (round as unknown as { rewardsPerElement: number }).rewardsPerElement,
        ...richTags,
      })}
    </h1>
  );
}

function OddOneOutRoundCompletionRatePolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-2xl text-center">
      {fmt(formatMessage, messages.oddOneOutPenalty, {
        penalty: (round as unknown as { mistakePenalty: number }).mistakePenalty,
        ...richTags,
      })}
    </h1>
  );
}

function MatchingRoundCompletionRatePolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-2xl text-center">
      {fmt(formatMessage, messages.matchingPenalty, {
        penalty: (round as unknown as { mistakePenalty: number }).mistakePenalty,
        ...richTags,
      })}
    </h1>
  );
}

function NaguiRoundCompletionRatePolicyTitle() {
  const { formatMessage } = useIntl();
  return <h1 className="2xl:text-3xl text-center">{fmt(formatMessage, messages.naguiTitle, richTags)}</h1>;
}

function ReorderingRoundCompletionRatePolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl text-center">
      {fmt(formatMessage, messages.pointsPerCorrectPosition, {
        points: (round as unknown as { rewardsPerElement: number }).rewardsPerElement,
        ...richTags,
      })}
    </h1>
  );
}
