import { BlindtestQuestion, BlindtestType } from '@/backend/models/questions/Blindtest';
import { MatchingQuestion } from '@/backend/models/questions/Matching';
import { OddOneOutQuestion } from '@/backend/models/questions/OddOneOut';
import { QuoteAuthorElement, QuotePartElement, QuoteSourceElement } from '@/backend/models/questions/Quote';

import { RoundType } from '@/backend/models/rounds/RoundType';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';
import fmt, { keyChunks } from '@/utils/fmt';

const messages = defineMessages('frontend.game.round.RoundDescription', {
  basic: '🔀 Several direct questions on different topics, in a <b>random order.</b>',
  blindtest1: '👂 Listen to the music ({songEmoji}) or the sound ({soundEmoji}), and answer the question.',
  blindtest2: '🋺 Controls let you <b>adjust the volume</b> and <b>skip forward or backward in the timeline</b>.',
  emoji1: '🧐 Find the work or place/character/object/... hidden behind each combination of emojis.',
  emoji2: '🧩 This combination may evoke <b>general ideas</b>, or it may just be a <b>rebus</b>, it depends.',
  enumeration: '💬 Name as many elements as possible that answer the question.',
  image: '🧐 Find the work or place/character/object/... hidden behind each image.',
  labelling1: 'Each question consists of an image with numbered markers.',
  labelling2: '🫳 Find the labels corresponding to the markers.',
  labelling3: '👁️ If you get stuck, the organizers can <b>reveal an element</b>.',
  matching1:
    '🔀 A grid organized into <b>{min} to {max}</b> columns of proposals shown in random order, with links between them.',
  matching2: '🔗 The goal is to find the correct associations.',
  mixed: '🔀 Several questions of <b>different types</b>.',
  mcq: '🔀 Several direct questions on different topics, in a <b>random order.</b>',
  nagui: '🔀 Several direct questions on different topics, in a <b>random order.</b>',
  oddOneOut1: '🔀 A list of <b>{count} proposals</b> shown in a <b>random order</b> for each participant.',
  oddOneOut2: '<correct>All true</correct>, <incorrect>except one!</incorrect>',
  oddOneOut3: 'If you know the odd one out, <b>keep it secret</b>... 🤫',
  progressiveClues1: '🕵️ A <b>list of clues</b> is revealed to you progressively...',
  progressiveClues2: '🧠 <b>Search your memory</b> and guess the work/person/... hidden behind these clues.',
  quoteIntro: 'Each question consists of:',
  quotePart: 'A <b>quote</b>',
  quoteAuthor: 'The <b>person</b> who said it',
  quoteSource: 'The <b>work</b> it came from',
  quoteHidden: '🫳 <b>One, two or three</b> of these elements are <b>hidden</b>: find them.',
  quoteReveal: '👁️ If you get stuck, the organizers can <b>reveal an element</b>.',
  special: '<b>25 questions</b> organized into <b>5 levels</b>.',
});

const b = (chunks) => <strong>{keyChunks(chunks)}</strong>;
const correct = (chunks) => <span className="text-green-500">{keyChunks(chunks)}</span>;
const incorrect = (chunks) => <span className="font-bold text-red-500">{keyChunks(chunks)}</span>;
const richTags = { b, correct, incorrect };

function RuleP({ children }) {
  return <p className="2xl:text-2xl text-center">{children}</p>;
}

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

function BasicRoundDescription() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.basic, richTags)}</RuleP>;
}

function BlindtestRoundDescription() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>
        {formatMessage(messages.blindtest1, {
          songEmoji: BlindtestQuestion.typeToEmoji(BlindtestType.SONG),
          soundEmoji: BlindtestQuestion.typeToEmoji(BlindtestType.SOUND),
        })}
      </RuleP>
      <RuleP>{fmt(formatMessage, messages.blindtest2, richTags)}</RuleP>
    </>
  );
}

function EmojiRoundDescription() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{formatMessage(messages.emoji1)}</RuleP>
      <br />
      <RuleP>{fmt(formatMessage, messages.emoji2, richTags)}</RuleP>
    </>
  );
}

function EnumerationRoundDescription() {
  const { formatMessage } = useIntl();
  return <RuleP>{formatMessage(messages.enumeration)}</RuleP>;
}

function ImageRoundDescription() {
  const { formatMessage } = useIntl();
  return <RuleP>{formatMessage(messages.image)}</RuleP>;
}

function LabellingRoundDescription() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{formatMessage(messages.labelling1)}</RuleP>
      <br />
      <RuleP>{formatMessage(messages.labelling2)}</RuleP>
      <br />
      <RuleP>{fmt(formatMessage, messages.labelling3, richTags)}</RuleP>
    </>
  );
}

function MatchingRoundDescription() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>
        {fmt(formatMessage, messages.matching1, {
          min: MatchingQuestion.MIN_NUM_COLS,
          max: MatchingQuestion.MAX_NUM_COLS,
          ...richTags,
        })}
      </RuleP>
      <br />
      <RuleP>{formatMessage(messages.matching2)}</RuleP>
    </>
  );
}

function MCQRoundDescription() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.mcq, richTags)}</RuleP>;
}

function MixedRoundDescription() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.mixed, richTags)}</RuleP>;
}

function NaguiRoundDescription() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.nagui, richTags)}</RuleP>;
}

function OddOneOutRoundDescription() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.oddOneOut1, { count: OddOneOutQuestion.MAX_NUM_ITEMS, ...richTags })}</RuleP>
      <br />
      <RuleP>{fmt(formatMessage, messages.oddOneOut2, richTags)}</RuleP>
      <br />
      <RuleP>{fmt(formatMessage, messages.oddOneOut3, richTags)}</RuleP>
    </>
  );
}

function ProgressiveCluesRoundDescription() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{fmt(formatMessage, messages.progressiveClues1, richTags)}</RuleP>
      <br />
      <RuleP>{fmt(formatMessage, messages.progressiveClues2, richTags)}</RuleP>
    </>
  );
}

function QuoteRoundDescription() {
  const { formatMessage } = useIntl();
  return (
    <>
      <RuleP>{formatMessage(messages.quoteIntro)}</RuleP>
      <ul className="2xl:text-2xl list-disc pl-10">
        <li>
          {QuotePartElement.elementToEmoji()} {fmt(formatMessage, messages.quotePart, richTags)}
        </li>
        <li>
          {QuoteAuthorElement.elementToEmoji()} {fmt(formatMessage, messages.quoteAuthor, richTags)}
        </li>
        <li>
          {QuoteSourceElement.elementToEmoji()} {fmt(formatMessage, messages.quoteSource, richTags)}
        </li>
      </ul>
      <br />
      <RuleP>{fmt(formatMessage, messages.quoteHidden, richTags)}</RuleP>
      <br />
      <RuleP>{fmt(formatMessage, messages.quoteReveal, richTags)}</RuleP>
    </>
  );
}

function SpecialRoundDescription() {
  const { formatMessage } = useIntl();
  return <RuleP>{fmt(formatMessage, messages.special, richTags)}</RuleP>;
}
