import { useIntl } from 'react-intl';

import fmt, { keyChunks } from '@/frontend/helpers/fmt';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import { GameEnumerationQuestion } from '@/models/questions/Enumeration';
import { GameMatchingQuestion, MatchingQuestion } from '@/models/questions/Matching';
import { NaguiQuestion } from '@/models/questions/Nagui';
import { OddOneOutQuestion } from '@/models/questions/OddOneOut';
import { GameReorderingQuestion } from '@/models/questions/Reordering';
import { RoundType } from '@/models/rounds/RoundType';

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
  specialInstruction: '🗣️ Answer the questions directly — there are no answer choices.',
  specialPrecision: '⚠️ Be precise in your answer!',
  specialCalm: '💜 Stay calm, it will be fine.',
  mixedInstruction: 'Rules depend on the question type.',
});

// ── Rich-text tag factories ───────────────────────────────────────────────────
const b = (chunks) => <strong>{keyChunks(chunks)}</strong>;
const u = (chunks) => <u>{keyChunks(chunks)}</u>;
const buzz = (chunks) => <span className="font-bold text-red-500">{keyChunks(chunks)}</span>;
const cancel = (chunks) => <span className="font-bold text-blue-400">{keyChunks(chunks)}</span>;
const correct = (chunks) => <span className="text-green-500 font-bold">{keyChunks(chunks)}</span>;
const incorrect = (chunks) => <span className="text-red-500 font-bold">{keyChunks(chunks)}</span>;
const richTags = { b, u, buzz, cancel, correct, incorrect };

// ── Layout primitives ─────────────────────────────────────────────────────────
function RuleP({ children }) {
  return <p className="2xl:text-2xl text-center">{children}</p>;
}

function RuleList({ children }) {
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

function ThinkingTimeRule({ seconds }) {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.thinkingTime, { seconds, ...richTags })}</RuleP>;
}

function MaxTriesRule({ maxTries }) {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.maxTries, { maxTries, ...richTags })}</RuleP>;
}

function PartialCreditRule() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.partialCredit, richTags)}</RuleP>;
}

function TurnOrderRule({ order }) {
  const { formatMessage } = useIntl();
  const orderText =
    order > 0
      ? formatMessage(globalMessages.reverseRankingFromRound, { roundNumber: order })
      : formatMessage(globalMessages.randomOrder);
  return <RuleP>{formatMessage(globalMessages.turnOrder, { order: orderText })}</RuleP>;
}

// ── Shared buzzer round rules (Emoji, Image, Blindtest, ProgressiveClues) ─────
function BuzzerRoundRules({ round, withBuzzerDelay = false }) {
  const { formatMessage } = useIntl();
  const incorrectMsg = withBuzzerDelay ? messages.incorrectWithBuzzerDelay : messages.incorrectNextInQueue;
  return (
    <>
      <BuzzInstruction />
      <QueueLeader />
      <RuleList>
        <li>{fmt(formatMessage, messages.correctEarnPoints, { points: round.rewardsPerQuestion, ...richTags })}</li>
        <li>{fmt(formatMessage, incorrectMsg, { delay: round.delay, ...richTags })}</li>
      </RuleList>
      <ThinkingTimeRule seconds={round.thinkingTime} />
      <MaxTriesRule maxTries={round.maxTries} />
    </>
  );
}

// ── Shared buzzer + partial credit (Quote, Labelling) ─────────────────────────
function BuzzerPartialCreditRoundRules({ round }) {
  return (
    <>
      <BuzzInstruction />
      <QueueLeader />
      <ThinkingTimeRule seconds={round.thinkingTime} />
      <MaxTriesRule maxTries={round.maxTries} />
      <PartialCreditRule />
    </>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export function RoundRules({ round }) {
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
      return <MixedRoundRules round={round} />;
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
    case RoundType.SPECIAL:
      return <SpecialRoundRules round={round} />;
  }
}
function BasicRoundRules({ round }) {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{formatMessage(messages.basicInstruction)}</RuleP>
      <RuleList>
        <li>{fmt(formatMessage, messages.basicCorrect, { points: round.rewardsPerQuestion, ...richTags })}</li>
        <li>{fmt(formatMessage, messages.basicIncorrect, richTags)}</li>
      </RuleList>
      <ThinkingTimeRule seconds={round.thinkingTime} />
      <TurnOrderRule order={round.order} />
    </>
  );
}

function EnumerationRoundRules({ round }) {
  const { formatMessage } = useIntl();
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
            points: round.rewardsPerQuestion,
            bonus: round.rewardsForBonus,
            ...richTags,
          })}
        </li>
        <li>{fmt(formatMessage, messages.enumBidNotMet, { points: round.rewardsPerQuestion, ...richTags })}</li>
      </RuleList>
    </>
  );
}

function EstimationRoundRules({ round }) {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.estimationBetInstruction, richTags)}</RuleP>
      <RuleP>{fmt(formatMessage, messages.estimationOneSubmission, richTags)}</RuleP>
      <RuleList>
        <li>{fmt(formatMessage, messages.estimationExactWins, richTags)}</li>
        <li>{fmt(formatMessage, messages.estimationRangeFallback, richTags)}</li>
      </RuleList>
      <RuleP>{fmt(formatMessage, messages.estimationReward, { points: round.rewardsPerQuestion, ...richTags })}</RuleP>
      <RuleP>
        {fmt(formatMessage, messages.estimationThinkingTime, {
          seconds: round.thinkingTime || GameEnumerationQuestion.THINKING_TIME,
          ...richTags,
        })}
      </RuleP>
    </>
  );
}

function MatchingRoundRules({ round }) {
  const { formatMessage } = useIntl();
  const { order, mistakePenalty, maxMistakes } = round;
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
          maxMistakes: maxMistakes || MatchingQuestion.MAX_NUM_MISTAKES,
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

function MCQRoundRules({ round }) {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{formatMessage(messages.mcqInstruction)}</RuleP>
      <TurnOrderRule order={round.order} />
    </>
  );
}

function NaguiRoundRules({ round }) {
  const intl = useIntl();
  return (
    <>
      <RuleP>
        {fmt(intl.formatMessage.bind(intl), messages.naguiInstruction, {
          count: Object.keys(NaguiQuestion.OPTIONS).length,
          ...richTags,
        })}
      </RuleP>
      <ol className="2xl:text-2xl border-solid border-blue-500 border-2 p-2">
        {Object.keys(NaguiQuestion.OPTIONS).map((option, index) => (
          <li key={index}>
            {NaguiQuestion.typeToEmoji(option)} {NaguiQuestion.typeToTitle(option, intl.locale)} (
            {round.rewardsPerQuestion[option]} pt{round.rewardsPerQuestion[option] > 1 && 's'})
          </li>
        ))}
      </ol>
      <TurnOrderRule order={round.order} />
    </>
  );
}

function OddOneOutRoundRules({ round }) {
  const { formatMessage } = useIntl();
  const { order, mistakePenalty } = round;
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.oddOneOutInstruction, richTags)}</RuleP>
      <RuleList>
        <li>{fmt(formatMessage, messages.oddOneOutCorrect, richTags)}</li>
        <li>{fmt(formatMessage, messages.oddOneOutIncorrect, { penalty: mistakePenalty, ...richTags })}</li>
      </RuleList>
      <RuleP>{fmt(formatMessage, messages.oddOneOutNote, richTags)}</RuleP>
      <RuleP>
        {fmt(formatMessage, messages.oddOneOutThinkingTime, { seconds: OddOneOutQuestion.THINKING_TIME, ...richTags })}
      </RuleP>
      <TurnOrderRule order={order} />
    </>
  );
}

function ReorderingRoundRules({ round }) {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.reorderingInstruction, richTags)}</RuleP>
      <RuleP>{fmt(formatMessage, messages.reorderingScoring, { points: round.rewardsPerElement, ...richTags })}</RuleP>
      <RuleP>{fmt(formatMessage, messages.reorderingOneSubmission, richTags)}</RuleP>
      <RuleP>
        {fmt(formatMessage, messages.reorderingThinkingTime, {
          seconds: round.thinkingTime || GameReorderingQuestion.THINKING_TIME,
          ...richTags,
        })}
      </RuleP>
    </>
  );
}

function SpecialRoundRules() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>
        <strong>{formatMessage(messages.specialInstruction)}</strong>
      </RuleP>
      <RuleP>{formatMessage(messages.specialPrecision)}</RuleP>
      <RuleP>{formatMessage(messages.specialCalm)}</RuleP>
    </>
  );
}

function MixedRoundRules() {
  const { formatMessage } = useIntl();
  return <RuleP>{formatMessage(messages.mixedInstruction)}</RuleP>;
}
