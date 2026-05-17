'use client';

import { type ReactNode } from 'react';

import { useIntl } from 'react-intl';

import { rankingToEmoji } from '@/frontend/helpers/emojis';
import fmt, { keyChunks } from '@/frontend/helpers/fmt';
import defineMessages from '@/frontend/i18n/defineMessages';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';

const messages = defineMessages('frontend.game.round.RoundRankingPolicy', {
  scale: 'The scale',
  pts: '{reward} pts',
  teamsRankedOrder: 'where teams are ranked in <b>{order}</b> order of points earned.',
  ascending: '⚠️ ascending',
  descending: 'descending',
  pointsPerCorrectAnswer: '<b>{points} point</b> per correct answer',
  pointsPerElementFound: '<b>{points} point</b> per correct element found',
  pointsPerOddOneOut: '<b>{points, plural, one {# point} other {# points}}</b> per intruder found',
  pointsPerIncorrectLink: '<b>{points, plural, one {# point} other {# points}}</b> per incorrect link',
  variablePointsPerAnswer: 'A variable number of points per correct answer',
  pointsPerCorrectPosition: '<b>{points} point</b> per item in correct position',
  turnOrderInverse: 'Turn order = Inverse ranking from round {roundNumber}.',
  turnOrderRandom: 'Turn order = Random order.',
});

const b = (chunks: ReactNode[]) => <strong>{keyChunks(chunks)}</strong>;
const richTags = { b };

export function RoundRankingPolicy({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const orderKey =
    round.type === RoundType.ODD_ONE_OUT || round.type === RoundType.MATCHING
      ? formatMessage(messages.ascending)
      : formatMessage(messages.descending);
  return (
    <div className="flex flex-col items-center justify-start space-y-4 p-2">
      <RoundRankingPolicyTitle round={round} />
      <div className="flex flex-col items-center justify-start">
        <p className="text-xs sm:text-sm 2xl:text-base 2xl:text-xl">{formatMessage(messages.scale)}</p>
        <ol className="2xl:text-2xl border-solid border-yellow-500 border-2 p-2">
          {((round as unknown as { rewards: number[] }).rewards ?? []).map((reward: number, index: number) => (
            <li key={index}>
              {rankingToEmoji(index)} {formatMessage(messages.pts, { reward })}
            </li>
          ))}
        </ol>
        <br></br>
        <p className="2xl:text-2xl text-center">
          {fmt(formatMessage, messages.teamsRankedOrder, { order: orderKey, ...richTags })}
        </p>
      </div>
    </div>
  );
}

function RoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  switch (round.type) {
    case RoundType.PROGRESSIVE_CLUES:
    case RoundType.BASIC:
    case RoundType.BLINDTEST:
    case RoundType.EMOJI:
    case RoundType.ENUMERATION:
    case RoundType.ESTIMATION:
    case RoundType.IMAGE:
    case RoundType.NAGUI:
      return <BuzzerRoundRankingPolicyTitle round={round} />;
    case RoundType.LABELLING:
      return <LabelRoundRankingPolicyTitle round={round} />;
    case RoundType.MATCHING:
      return <MatchingRoundRankingPolicyTitle round={round} />;
    case RoundType.MCQ:
      return <MCQRoundRankingPolicyTitle round={round} />;
    case RoundType.ODD_ONE_OUT:
      return <OddOneOutRoundRankingPolicyTitle round={round} />;
    case RoundType.QUOTE:
      return <QuoteRoundRankingPolicyTitle round={round} />;
    case RoundType.REORDERING:
      return <ReorderingRoundRankingPolicyTitle round={round} />;
    default:
      return <></>;
  }
}

function BuzzerRoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl">
      {fmt(formatMessage, messages.pointsPerCorrectAnswer, {
        points: (round as unknown as { rewardsPerQuestion: number }).rewardsPerQuestion,
        ...richTags,
      })}
    </h1>
  );
}

function QuoteRoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl">
      {fmt(formatMessage, messages.pointsPerElementFound, {
        points: (round as unknown as { rewardsPerElement: number }).rewardsPerElement,
        ...richTags,
      })}
    </h1>
  );
}

function LabelRoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl">
      {fmt(formatMessage, messages.pointsPerElementFound, {
        points: (round as unknown as { rewardsPerElement: number }).rewardsPerElement,
        ...richTags,
      })}
    </h1>
  );
}

function OddOneOutRoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const mistakePenalty = (round as unknown as { mistakePenalty: number }).mistakePenalty;
  return (
    <h1 className="2xl:text-3xl">
      {fmt(formatMessage, messages.pointsPerOddOneOut, { points: Math.abs(mistakePenalty), ...richTags })}
    </h1>
  );
}

function MatchingRoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const mistakePenalty = (round as unknown as { mistakePenalty: number }).mistakePenalty;
  return (
    <h1 className="2xl:text-3xl">
      {fmt(formatMessage, messages.pointsPerIncorrectLink, { points: Math.abs(mistakePenalty), ...richTags })}
    </h1>
  );
}

function MCQRoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <>
      <h1 className="2xl:text-3xl text-center">{formatMessage(messages.variablePointsPerAnswer)}</h1>
    </>
  );
}

function ReorderingRoundRankingPolicyTitle({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  return (
    <h1 className="2xl:text-3xl">
      {fmt(formatMessage, messages.pointsPerCorrectPosition, {
        points: (round as unknown as { rewardsPerElement: number }).rewardsPerElement,
        ...richTags,
      })}
    </h1>
  );
}
