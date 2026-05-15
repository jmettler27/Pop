'use client';

import { type ReactNode } from 'react';

import { useIntl } from 'react-intl';

import fmt, { keyChunks } from '@/frontend/helpers/fmt';
import { type Locale } from '@/frontend/helpers/locales';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameEnumerationQuestion } from '@/models/questions/enumeration';
import { GameMatchingQuestion, MatchingQuestion } from '@/models/questions/matching';
import { NaguiQuestion } from '@/models/questions/nagui';
import { GameOddOneOutQuestion } from '@/models/questions/odd-one-out';
import { GameReorderingQuestion } from '@/models/questions/reordering';
import { RoundType } from '@/models/rounds/round-type';
import { AnyRound } from '@/models/rounds/RoundFactory';

const messages = defineMessages('frontend.game.round.RoundRules', {
  buzzInstruction:
    '💡 As soon as you have an idea, <buzz>buzz</buzz> by clicking <b>"Buzz"</b>. You can <cancel>cancel your buzz</cancel> by clicking <b>"Cancel"</b>.',
  queueLeader: '🥇 If you are at the top of the queue, give your answer verbally.',
  correctEarnPoints:
    'If your answer is <correct>correct</correct>, you earn <b>{points} point</b> and the question ends.',
  incorrectNextInQueue:
    'If your answer is <incorrect>incorrect</incorrect>, your attempt is invalidated and we move to the next player in the queue, if any.',
  incorrectWithBuzzerDelay:
    'If your answer is <incorrect>incorrect</incorrect>, your attempt is invalidated and we move to the next player in the queue. Furthermore, <b>your buzzer is disabled until clue i + {delay}</b>.',
  thinkingTime: '⏳ You have <u><b>{seconds} seconds</b></u> to answer, otherwise your attempt will be invalidated!',
  maxTries: '⚠️ You have <b>{maxTries} attempts per question</b>.',
  partialCredit: '😈 You can earn points <b>even if you do not know all the elements!</b>',
  oddOneOutInstruction: '🖱️ Each team takes turns and <b>clicks on a proposal from the list</b> it considers correct.',
  oddOneOutCorrect: 'If the proposal is <correct>correct</correct>, we move to the next team.',
  oddOneOutIncorrect:
    'If the proposal is <incorrect>incorrect</incorrect>, the question ends and the team receives <b>{penalty} point(s) of penalty.</b> Furthermore, it becomes <b>1st in the turn order for the next question</b>.',
  oddOneOutNote: 'ℹ️ A short <b>explanation</b> is shown each time.',
  oddOneOutThinkingTime:
    '⏳ You have <u><b>{seconds} seconds</b></u> to decide, otherwise <b>a proposal will be chosen randomly!</b>',
  enumTwoPhases: 'The question takes place in <b>two phases</b>:',
  enumPhaseThinking: '🤔 A <b>thinking</b> phase during which teams choose their bid.',
  enumPhaseAnswer: '🗣️ An <b>answer</b> phase during which the team with the highest bid gives their answers.',
  enumOutcomes: 'There are then two possible outcomes:',
  enumBidMet:
    'The bid is <correct>met</correct>: the team earns <b>{points} point</b>, <b>+{bonus} bonus point</b> if they give even more answers than announced.',
  enumBidNotMet: 'The bid is <incorrect>not met</incorrect>: all other teams earn <b>{points} point</b>.',
  estimationBetInstruction: '💡 Each team submits a bet: an <b>exact value</b> or a <b>range</b>.',
  estimationExactWins: 'Exact bets are checked first: a <correct>perfect match</correct> on the answer wins.',
  estimationRangeFallback:
    'Otherwise, the team(s) with the <b>smallest range</b> containing the correct answer win(s).',
  estimationReward: '🏆 Winner(s) earn <b>{points} point</b>.',
  estimationOneSubmission: '⚠️ <b>One submission per team</b> — once submitted, your bet is final!',
  estimationThinkingTime:
    '⏳ You have <u><b>{seconds} seconds</b></u> to submit, otherwise <b>no points will be awarded!</b>',
  matchingInstruction:
    '🖱️ Each team takes turns and <b>clicks on the proposals</b> for the link it considers correct, <u>left to right</u>.',
  matchingCorrect: 'If the link is <correct>correct</correct>, we move to the next team.',
  matchingIncorrect:
    'If the link is <incorrect>incorrect</incorrect>, the team receives <b>{penalty} point(s) of penalty.</b>',
  matchingAlwaysDrawn: '⚠️ <b>In any case, the link is drawn!</b>',
  matchingDisqualified:
    '🙅 A team is <b>disqualified</b> after <b>{maxMistakes} mistakes</b>; the question ends if all teams are disqualified.',
  matchingThinkingTime:
    '⏳ You have <u><b>between {min} and {max} seconds</b></u> to decide, otherwise <b>a random link will be drawn!</b>',
  basicInstruction: '❓ Each question is assigned to a team, which must give their answer verbally.',
  basicCorrect: 'If your answer is <correct>correct</correct>, you earn <b>{points} point</b>.',
  basicIncorrect: 'If your answer is <incorrect>incorrect</incorrect>, you earn no points.',
  mcqInstruction: '❓ Each question is assigned to a team. The team has several answer choices.',
  naguiInstruction: '❓ Each question is assigned to a team. The team has <b>{count} options</b> available:',
  reorderingInstruction:
    '👆 <b>Drag and drop</b> the items to reorder them in the <b>correct sequence</b>, then <b>submit</b> your ordering.',
  reorderingScoring: 'Each item in the <correct>correct position</correct> earns <b>{points} point</b> for your team.',
  reorderingOneSubmission: '⚠️ <b>One submission per team</b> — once submitted, your ordering is final!',
  reorderingThinkingTime:
    '⏳ You have <u><b>{seconds} seconds</b></u> to submit, otherwise <b>no points will be awarded!</b>',
  mixedInstruction: 'Rules depend on the question type.',
});

// ── Rich-text tag factories ───────────────────────────────────────────────────
const b = (chunks: ReactNode[]) => <strong>{keyChunks(chunks)}</strong>;
const u = (chunks: ReactNode[]) => <u>{keyChunks(chunks)}</u>;
const buzz = (chunks: ReactNode[]) => <span className="font-bold text-red-500">{keyChunks(chunks)}</span>;
const cancel = (chunks: ReactNode[]) => <span className="font-bold text-blue-400">{keyChunks(chunks)}</span>;
const correct = (chunks: ReactNode[]) => <span className="text-green-500 font-bold">{keyChunks(chunks)}</span>;
const incorrect = (chunks: ReactNode[]) => <span className="text-red-500 font-bold">{keyChunks(chunks)}</span>;
const richTags = { b, u, buzz, cancel, correct, incorrect };

// ── Layout primitives ─────────────────────────────────────────────────────────
function RuleP({ children }: { children: ReactNode }) {
  return <p className="2xl:text-2xl text-center">{children}</p>;
}

function RuleList({ children }: { children: ReactNode }) {
  return <ul className="2xl:text-2xl list-disc pl-10">{children}</ul>;
}

// ── Reusable rule atoms ───────────────────────────────────────────────────────
function BuzzInstruction() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.buzzInstruction, richTags)}</RuleP>;
}

function QueueLeader() {
  const { formatMessage } = useIntl();
  return <RuleP>{formatMessage(messages.queueLeader)}</RuleP>;
}

function ThinkingTimeRule({ seconds }: { seconds: number }) {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.thinkingTime, { seconds, ...richTags })}</RuleP>;
}

function MaxTriesRule({ maxTries }: { maxTries: number }) {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.maxTries, { maxTries, ...richTags })}</RuleP>;
}

function PartialCreditRule() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.partialCredit, richTags)}</RuleP>;
}

function TurnOrderRule({ order }: { order: number }) {
  const { formatMessage } = useIntl();
  const orderText =
    order > 0
      ? formatMessage(globalMessages.reverseRankingFromRound, { roundNumber: order })
      : formatMessage(globalMessages.randomOrder);
  return <RuleP>{formatMessage(globalMessages.turnOrder, { order: orderText })}</RuleP>;
}

// ── Shared buzzer round rules (Emoji, Image, Blindtest, ProgressiveClues) ─────
function BuzzerRoundRules({ round, withBuzzerDelay = false }: { round: AnyRound; withBuzzerDelay?: boolean }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { rewardsPerQuestion: number; delay: number; thinkingTime: number; maxTries: number };
  const incorrectMsg = withBuzzerDelay ? messages.incorrectWithBuzzerDelay : messages.incorrectNextInQueue;
  return (
    <>
      <BuzzInstruction />
      <QueueLeader />
      <RuleList>
        <li>{fmt(formatMessage, messages.correctEarnPoints, { points: r.rewardsPerQuestion, ...richTags })}</li>
        <li>{fmt(formatMessage, incorrectMsg, { delay: r.delay, ...richTags })}</li>
      </RuleList>
      <ThinkingTimeRule seconds={r.thinkingTime} />
      <MaxTriesRule maxTries={r.maxTries} />
    </>
  );
}

// ── Shared buzzer + partial credit (Quote, Labelling) ─────────────────────────
function BuzzerPartialCreditRoundRules({ round }: { round: AnyRound }) {
  const r = round as unknown as { thinkingTime: number; maxTries: number };
  return (
    <>
      <BuzzInstruction />
      <QueueLeader />
      <ThinkingTimeRule seconds={r.thinkingTime} />
      <MaxTriesRule maxTries={r.maxTries} />
      <PartialCreditRule />
    </>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export function RoundRules({ round }: { round: AnyRound }) {
  switch (round.type) {
    case RoundType.BASIC:
      return <BasicRoundRules round={round} />;
    case RoundType.BLINDTEST:
      return <BuzzerRoundRules round={round} />;
    case RoundType.EMOJI:
      return <BuzzerRoundRules round={round} />;
    case RoundType.ENUMERATION:
      return <EnumerationRoundRules round={round} />;
    case RoundType.ESTIMATION:
      return <EstimationRoundRules round={round} />;
    case RoundType.IMAGE:
      return <BuzzerRoundRules round={round} />;
    case RoundType.LABELLING:
      return <BuzzerPartialCreditRoundRules round={round} />;
    case RoundType.MATCHING:
      return <MatchingRoundRules round={round} />;
    case RoundType.MCQ:
      return <MCQRoundRules round={round} />;
    case RoundType.MIXED:
      return <MixedRoundRules />;
    case RoundType.NAGUI:
      return <NaguiRoundRules round={round} />;
    case RoundType.ODD_ONE_OUT:
      return <OddOneOutRoundRules round={round} />;
    case RoundType.PROGRESSIVE_CLUES:
      return <BuzzerRoundRules round={round} withBuzzerDelay />;
    case RoundType.QUOTE:
      return <BuzzerPartialCreditRoundRules round={round} />;
    case RoundType.REORDERING:
      return <ReorderingRoundRules round={round} />;
    default:
      return null;
  }
}

function BasicRoundRules({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { rewardsPerQuestion: number; thinkingTime: number; order: number };
  return (
    <>
      <RuleP>{formatMessage(messages.basicInstruction)}</RuleP>
      <RuleList>
        <li>{fmt(formatMessage, messages.basicCorrect, { points: r.rewardsPerQuestion, ...richTags })}</li>
        <li>{fmt(formatMessage, messages.basicIncorrect, richTags)}</li>
      </RuleList>
      <ThinkingTimeRule seconds={r.thinkingTime} />
      <TurnOrderRule order={r.order} />
    </>
  );
}

function EnumerationRoundRules({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { rewardsPerQuestion: number; rewardsForBonus: number };
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.enumTwoPhases, richTags)}</RuleP>
      <ol className="2xl:text-2xl list-decimal pl-10">
        <li>{fmt(formatMessage, messages.enumPhaseThinking, richTags)}</li>
        <li>{fmt(formatMessage, messages.enumPhaseAnswer, richTags)}</li>
      </ol>
      <RuleP>{formatMessage(messages.enumOutcomes)}</RuleP>
      <RuleList>
        <li>
          {fmt(formatMessage, messages.enumBidMet, {
            points: r.rewardsPerQuestion,
            bonus: r.rewardsForBonus,
            ...richTags,
          })}
        </li>
        <li>{fmt(formatMessage, messages.enumBidNotMet, { points: r.rewardsPerQuestion, ...richTags })}</li>
      </RuleList>
    </>
  );
}

function EstimationRoundRules({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { rewardsPerQuestion: number; thinkingTime: number };
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.estimationBetInstruction, richTags)}</RuleP>
      <RuleP>{fmt(formatMessage, messages.estimationOneSubmission, richTags)}</RuleP>
      <RuleList>
        <li>{fmt(formatMessage, messages.estimationExactWins, richTags)}</li>
        <li>{fmt(formatMessage, messages.estimationRangeFallback, richTags)}</li>
      </RuleList>
      <RuleP>{fmt(formatMessage, messages.estimationReward, { points: r.rewardsPerQuestion, ...richTags })}</RuleP>
      <RuleP>
        {fmt(formatMessage, messages.estimationThinkingTime, {
          seconds: r.thinkingTime || GameEnumerationQuestion.DEFAULT_THINKING_TIME,
          ...richTags,
        })}
      </RuleP>
    </>
  );
}

function MatchingRoundRules({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { order: number; mistakePenalty: number; maxMistakes: number };
  const { order, mistakePenalty, maxMistakes } = r;
  const minSeconds = GameMatchingQuestion.THINKING_TIME * (MatchingQuestion.MIN_NUM_COLS - 1);
  const maxSeconds = GameMatchingQuestion.THINKING_TIME * (MatchingQuestion.MAX_NUM_COLS - 1);
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.matchingInstruction, richTags)}</RuleP>
      <RuleList>
        <li>{fmt(formatMessage, messages.matchingCorrect, richTags)}</li>
        <li>{fmt(formatMessage, messages.matchingIncorrect, { penalty: mistakePenalty, ...richTags })}</li>
      </RuleList>
      <RuleP>{fmt(formatMessage, messages.matchingAlwaysDrawn, richTags)}</RuleP>
      <RuleP>
        {fmt(formatMessage, messages.matchingDisqualified, {
          maxMistakes: maxMistakes || GameMatchingQuestion.MAX_NUM_MISTAKES,
          ...richTags,
        })}
      </RuleP>
      <RuleP>
        {fmt(formatMessage, messages.matchingThinkingTime, { min: minSeconds, max: maxSeconds, ...richTags })}
      </RuleP>
      <TurnOrderRule order={order} />
    </>
  );
}

function MCQRoundRules({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { order: number };
  return (
    <>
      <RuleP>{formatMessage(messages.mcqInstruction)}</RuleP>
      <TurnOrderRule order={r.order} />
    </>
  );
}

function NaguiRoundRules({ round }: { round: AnyRound }) {
  const intl = useIntl();
  const r = round as unknown as { rewardsPerQuestion: Record<string, number>; order: number };
  return (
    <>
      <RuleP>
        {fmt(intl.formatMessage, messages.naguiInstruction, {
          count: Object.keys(NaguiQuestion.OPTIONS).length,
          ...richTags,
        })}
      </RuleP>
      <ol className="2xl:text-2xl border-solid border-blue-500 border-2 p-2">
        {Object.keys(NaguiQuestion.OPTIONS).map((option, index) => (
          <li key={index}>
            {NaguiQuestion.typeToEmoji(option)} {NaguiQuestion.typeToTitle(option, intl.locale as Locale)} (
            {r.rewardsPerQuestion[option]} pt{r.rewardsPerQuestion[option] > 1 && 's'})
          </li>
        ))}
      </ol>
      <TurnOrderRule order={r.order} />
    </>
  );
}

function OddOneOutRoundRules({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { order: number; mistakePenalty: number };
  const { order, mistakePenalty } = r;
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.oddOneOutInstruction, richTags)}</RuleP>
      <RuleList>
        <li>{fmt(formatMessage, messages.oddOneOutCorrect, richTags)}</li>
        <li>{fmt(formatMessage, messages.oddOneOutIncorrect, { penalty: mistakePenalty, ...richTags })}</li>
      </RuleList>
      <RuleP>{fmt(formatMessage, messages.oddOneOutNote, richTags)}</RuleP>
      <RuleP>
        {fmt(formatMessage, messages.oddOneOutThinkingTime, {
          seconds: GameOddOneOutQuestion.THINKING_TIME,
          ...richTags,
        })}
      </RuleP>
      <TurnOrderRule order={order} />
    </>
  );
}

function ReorderingRoundRules({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();
  const r = round as unknown as { rewardsPerElement: number; thinkingTime: number };
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.reorderingInstruction, richTags)}</RuleP>
      <RuleP>{fmt(formatMessage, messages.reorderingScoring, { points: r.rewardsPerElement, ...richTags })}</RuleP>
      <RuleP>{fmt(formatMessage, messages.reorderingOneSubmission, richTags)}</RuleP>
      <RuleP>
        {fmt(formatMessage, messages.reorderingThinkingTime, {
          seconds: r.thinkingTime || GameReorderingQuestion.THINKING_TIME,
          ...richTags,
        })}
      </RuleP>
    </>
  );
}

function MixedRoundRules() {
  const { formatMessage } = useIntl();
  return <RuleP>{formatMessage(messages.mixedInstruction)}</RuleP>;
}
