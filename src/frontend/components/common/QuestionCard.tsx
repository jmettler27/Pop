import React from 'react';
import Image from 'next/image';

import { Divider, Tooltip } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import UserRepository from '@/backend/repositories/user/UserRepository';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/frontend/components/card';
import { formatAnswerValue } from '@/frontend/components/game/main-pane/question/estimation/EstimationCommon';
import type { Locale } from '@/frontend/helpers/locales';
import { LOCALE_TO_EMOJI } from '@/frontend/helpers/locales';
import { QUESTION_ELEMENT_TO_EMOJI, QUESTION_ELEMENT_TO_TITLE } from '@/frontend/helpers/question';
import { timestampToDate, type FirestoreTimestamp } from '@/frontend/helpers/time';
import { BlindtestQuestion } from '@/models/questions/blindtest';
import { MCQQuestion } from '@/models/questions/mcq';
import { NaguiQuestion } from '@/models/questions/nagui';
import { QuestionType, questionTypeToEmoji } from '@/models/questions/question-type';
import type { AnyBaseQuestion } from '@/models/questions/QuestionFactory';
import { prependTopicWithEmoji, topicToEmoji, type Topic } from '@/models/topic';

interface QuestionCardProps {
  baseQuestion: AnyBaseQuestion;
  showType?: boolean;
}

export function QuestionCard({ baseQuestion, showType = false }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm sm:text-base lg:text-lg dark:text-white">
          <QuestionCardTitle baseQuestion={baseQuestion} showType={showType} />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <QuestionCardContent baseQuestion={baseQuestion} />
      </CardContent>

      <Divider className="my-2 bg-slate-600" />
      <CardFooter>
        <QuestionCardFooter baseQuestion={baseQuestion} />
      </CardFooter>
    </Card>
  );
}

interface QuestionCardTitleProps {
  baseQuestion: AnyBaseQuestion;
  showType?: boolean;
}

export function QuestionCardTitle({ baseQuestion, showType = false }: QuestionCardTitleProps) {
  const intl = useIntl();
  const emoji = questionTypeToEmoji(baseQuestion.type);

  switch (baseQuestion.type) {
    case QuestionType.BLINDTEST:
      return (
        <span>
          {showType && emoji}
          {BlindtestQuestion.typeToEmoji((baseQuestion as InstanceType<typeof BlindtestQuestion>).subtype ?? '')}
          {topicToEmoji(baseQuestion.topic as Topic)} {(baseQuestion as { title: string }).title}
        </span>
      );
    case QuestionType.MATCHING:
      return (
        <span>
          {showType && emoji}
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
          <strong>({(baseQuestion as { numCols: number }).numCols} col)</strong>{' '}
          {(baseQuestion as { title: string }).title}
        </span>
      );
    case QuestionType.EMOJI:
    case QuestionType.IMAGE:
    case QuestionType.QUOTE:
      return (
        <span>
          {showType && emoji}
          {prependTopicWithEmoji(baseQuestion.topic as Topic, intl.locale as Locale)}
        </span>
      );
    case QuestionType.ENUMERATION:
    case QuestionType.LABELLING:
    case QuestionType.ODD_ONE_OUT:
    case QuestionType.PROGRESSIVE_CLUES:
    case QuestionType.REORDERING:
      return (
        <span>
          {showType && emoji}
          {topicToEmoji(baseQuestion.topic as Topic)} {(baseQuestion as { title: string }).title}
        </span>
      );
    case QuestionType.ESTIMATION:
    case QuestionType.BASIC:
    case QuestionType.MCQ:
    case QuestionType.NAGUI:
      return (
        <span>
          {showType && emoji}
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
          {(baseQuestion as { source?: string }).source && <i>{(baseQuestion as { source: string }).source}:</i>}{' '}
          {(baseQuestion as { title: string }).title}
        </span>
      );
    default:
      return null;
  }
}

interface QuestionCardFooterProps {
  baseQuestion: AnyBaseQuestion;
}

function QuestionCardFooter({ baseQuestion }: QuestionCardFooterProps) {
  const intl = useIntl();
  const userRepository = new UserRepository();
  const { user, loading, error } = userRepository.useUserOnce((baseQuestion as { createdBy: string }).createdBy);

  if (error || loading || !user) {
    return <></>;
  }

  return (
    <p className="text-xs sm:text-sm 2xl:text-base dark:text-white">
      {LOCALE_TO_EMOJI[(baseQuestion as { lang: keyof typeof LOCALE_TO_EMOJI }).lang]}{' '}
      {QUESTION_ELEMENT_TO_TITLE[intl.locale]['createdBy']} <strong>{user.name}</strong> (
      {timestampToDate((baseQuestion as { createdAt: FirestoreTimestamp | null | undefined }).createdAt, intl.locale)})
    </p>
  );
}

interface QuestionCardContentProps {
  baseQuestion: AnyBaseQuestion;
}

export function QuestionCardContent({ baseQuestion }: QuestionCardContentProps) {
  switch (baseQuestion.type) {
    case QuestionType.BASIC:
      return <BasicCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.BLINDTEST:
      return <BlindtestCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.EMOJI:
      return <EmojiCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.ENUMERATION:
      return <EnumerationCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.ESTIMATION:
      return <EstimationCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.IMAGE:
      return <ImageCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.LABELLING:
      return <LabellingCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.MATCHING:
      return <MatchingCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.MCQ:
      return <MCQCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.NAGUI:
      return <NaguiCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.ODD_ONE_OUT:
      return <OOOCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.PROGRESSIVE_CLUES:
      return <ProgressiveCluesCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.QUOTE:
      return <QuoteCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.REORDERING:
      return <ReorderingCardMainContent baseQuestion={baseQuestion} />;
    default:
      return <></>;
  }
}

const BasicCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { note?: string; answer: string; explanation?: string };
  const note = q.note;
  const answer = q.answer;
  const explanation = q.explanation;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">{answer}</span>
      {explanation && <p className="text-xs sm:text-sm 2xl:text-base dark:text-white">👉 {explanation}</p>}
    </div>
  );
};

const BlindtestCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as {
    audio: string;
    answer: { image?: string; title: string; author?: string; source?: string };
  };
  const audio = q.audio;
  const answer = q.answer;
  const image = answer.image;
  const title = answer.title;
  const author = answer.author;
  const source = answer.source;

  return (
    <div className="flex flex-col w-full space-y-2">
      {image && (
        <Image
          src={image}
          alt={title}
          priority={true}
          height={0}
          width={0}
          style={{
            width: 'auto',
            height: '150px',
            objectFit: 'cover',
          }}
          className="self-center"
        />
      )}
      <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
        <strong>{title}</strong>
      </span>
      {author && (
        <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['author']} {author}
        </span>
      )}
      {source && (
        <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
        </span>
      )}
      <audio src={audio} controls className="w-full" />
    </div>
  );
};

const EmojiCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { answer: { image?: string; title: string }; clue: string };
  const image = q.answer.image;
  const title = q.answer.title;
  const clue = q.clue;

  return (
    <div className="flex flex-col w-full space-y-2">
      {image && (
        <Image
          src={image}
          alt={title}
          priority={true}
          height={0}
          width={0}
          style={{
            width: 'auto',
            height: '150px',
            objectFit: 'cover',
          }}
          className="self-center"
        />
      )}
      <span className="text-2xl sm:text-3xl self-center">{clue}</span>
      <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
        <strong>{title}</strong>
      </span>
    </div>
  );
};

const ImageCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { image: string; answer: { description?: string; source: string } };
  const image = q.image;
  const description = q.answer.description;
  const source = q.answer.source;

  return (
    <div className="flex flex-col w-full space-y-2">
      <Image
        src={image}
        alt={description ? `${description} - ${source}` : source}
        priority={true}
        height={0}
        width={0}
        style={{
          width: 'auto',
          height: '150px',
          objectFit: 'cover',
        }}
        className="self-center"
      />
      {description && (
        <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['description']} {description}
        </span>
      )}
      <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
        {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
      </span>
    </div>
  );
};

const ENUM_MAX_NUM_ELEMENTS = 10;

const EnumerationCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as {
    note?: string;
    maxIsKnown: boolean;
    thinkingTime?: number;
    challengeTime?: number;
    answer: string[];
  };
  const note = q.note;
  const maxIsKnown = q.maxIsKnown;
  const answer = q.answer;

  const totalNumElements = answer.length;

  return (
    <>
      <div className="flex flex-col w-full space-y-2">
        {note && (
          <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
            {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
          </p>
        )}
        <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
          <strong>
            {!maxIsKnown && '>='} {totalNumElements}
          </strong>{' '}
          elements
        </span>
        <ul className="list-disc py-1 pl-5">
          {answer.slice(0, ENUM_MAX_NUM_ELEMENTS).map((element, idx) => (
            <li className="text-xs sm:text-sm 2xl:text-base dark:text-white" key={idx}>
              {element}
            </li>
          ))}
          {(totalNumElements > ENUM_MAX_NUM_ELEMENTS || !maxIsKnown) && (
            <li className="text-xs sm:text-sm 2xl:text-base dark:text-white" key={ENUM_MAX_NUM_ELEMENTS}>
              ...
            </li>
          )}
        </ul>
      </div>
    </>
  );
};

const EstimationCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const intl = useIntl();
  const q = baseQuestion as { answer: unknown; answerType: string; explanation?: string; note?: string };
  const answer = q.answer;
  const answerType = q.answerType;
  const explanation = q.explanation;
  const note = q.note;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
        {formatAnswerValue(answerType, answer as string | undefined, intl.locale)}
      </span>
      {explanation && <p className="text-xs sm:text-sm 2xl:text-base dark:text-white">👉 {explanation}</p>}
    </div>
  );
};

const LabellingCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { title: string; image?: string; labels: string[] };
  const title = q.title;
  const image = q.image;
  const labels = q.labels;

  return (
    <div className="flex flex-col w-full space-y-2">
      {image && (
        <Image
          src={image}
          alt={title}
          priority={true}
          height={0}
          width={0}
          style={{
            width: 'auto',
            height: '150px',
            objectFit: 'cover',
          }}
          className="self-center"
        />
      )}
      <ol className="list-decimal py-1 pl-5">
        {labels.map((label, idx) => (
          <li className="text-xs sm:text-sm 2xl:text-base dark:text-white" key={idx}>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
};

const MatchingCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { note?: string; answer: Record<string, string[]> };
  const note = q.note;
  const answer = q.answer;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <ul className="list-disc py-1 pl-5">
        {Object.values(answer).map((match, idx) => (
          <li key={idx} className="text-xs sm:text-sm 2xl:text-base dark:text-white">
            {match.join(' - ')}
          </li>
        ))}
      </ul>
    </div>
  );
};

const MCQCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { note?: string; choices: string[]; answerIdx: number; explanation?: string };
  const note = q.note;
  const choices = q.choices;
  const answerIdx = q.answerIdx;
  const explanation = q.explanation;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <ul>
        {choices.map((choice, idx) => (
          <li
            key={idx}
            className={clsx(
              idx === answerIdx ? 'text-green-500' : 'dark:text-white',
              'text-xs sm:text-sm 2xl:text-base'
            )}
          >
            {MCQQuestion.CHOICES[idx]}. {choice}
          </li>
        ))}
      </ul>
      {explanation && <p className="text-xs sm:text-sm 2xl:text-base dark:text-white">👉 {explanation}</p>}
    </div>
  );
};

const NaguiCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as {
    note?: string;
    choices: string[];
    answerIdx: number;
    duoIdx: number;
    explanation?: string;
  };
  const note = q.note;
  const choices = q.choices;
  const answerIdx = q.answerIdx;
  const duoIdx = q.duoIdx;
  const explanation = q.explanation;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <ul>
        {choices.map((choice, idx) => (
          <li
            key={idx}
            className={clsx(
              idx === answerIdx && 'text-green-500',
              idx === duoIdx && 'text-blue-500',
              idx !== answerIdx && idx !== duoIdx && 'dark:text-white'
            )}
          >
            {NaguiQuestion.CHOICES[idx]}. {choice}
          </li>
        ))}
      </ul>
      {explanation && <p className="text-xs sm:text-sm 2xl:text-base dark:text-white">👉 {explanation}</p>}
    </div>
  );
};

const OOOCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { note?: string; items: Array<{ title: string; explanation: string }>; answerIdx: number };
  const note = q.note;
  const items = q.items;
  const answerIdx = q.answerIdx;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <ul className="list-disc py-1 pl-5">
        {items.map((item, idx) => (
          <li
            key={idx}
            className={clsx(idx === answerIdx ? 'text-red-500' : 'dark:text-white', 'hover:font-bold cursor-pointer')}
          >
            <Tooltip key={idx} title={item.explanation} placement="right-start" arrow>
              <span>{item.title}</span>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProgressiveCluesCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { clues: string[]; answer: { image?: string; title: string } };
  const clues = q.clues;
  const image = q.answer.image;
  const title = q.answer.title;

  return (
    <div className="flex flex-col w-full space-y-2">
      {image && (
        <Image
          src={image}
          alt={title}
          priority={true}
          height={0}
          width={0}
          style={{
            width: 'auto',
            height: '150px',
            objectFit: 'cover',
          }}
          className="self-center"
        />
      )}
      <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
        <strong>{title}</strong>
      </span>
      <ol className="list-decimal py-1 pl-5">
        {clues.map((clue, idx) => (
          <li className="text-xs sm:text-sm 2xl:text-base dark:text-white" key={idx}>
            {clue}
          </li>
        ))}
      </ol>
    </div>
  );
};

const QuoteCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as unknown as {
    quote: string;
    source?: string;
    author?: string;
    toGuess: string[];
    quoteParts: Array<{ startIdx: number; endIdx: number }>;
  };
  const quote = q.quote;
  const source = q.source;
  const author = q.author;
  const toGuess = q.toGuess;
  const quoteParts = q.quoteParts;

  return (
    <div className="flex flex-col w-full space-y-2">
      <blockquote className="text-xs sm:text-sm 2xl:text-base dark:text-white">
        &quot;{<DisplayedQuote toGuess={toGuess} quote={quote} quoteParts={quoteParts} />}&quot;
      </blockquote>
      {author && (
        <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['author']} {<DisplayedAuthor toGuess={toGuess} author={author} />}
        </span>
      )}
      {source && (
        <span className="text-xs sm:text-sm 2xl:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{<DisplayedSource toGuess={toGuess} source={source} />}</i>
        </span>
      )}
    </div>
  );
};

interface DisplayedAuthorProps {
  toGuess: string[];
  author: string;
}

const DisplayedAuthor = ({ toGuess, author }: DisplayedAuthorProps) => {
  if (toGuess.includes('author')) {
    return <span className="text-yellow-500">{author}</span>;
  }
  return <span>{author}</span>;
};

interface DisplayedSourceProps {
  toGuess: string[];
  source: string;
}

const DisplayedSource = ({ toGuess, source }: DisplayedSourceProps) => {
  if (toGuess.includes('source')) {
    return <span className="text-yellow-500">{source}</span>;
  }
  return <span>{source}</span>;
};

interface DisplayedQuoteProps {
  toGuess: string[];
  quote: string;
  quoteParts: Array<{ startIdx: number; endIdx: number }>;
}

const DisplayedQuote = ({ toGuess, quote, quoteParts }: DisplayedQuoteProps) => {
  if (toGuess.includes('quote') && quoteParts.length > 0) {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    quoteParts
      .sort((a, b) => a.startIdx - b.startIdx)
      .forEach((quotePart, idx) => {
        const before = quote.substring(lastIndex, quotePart.startIdx);
        const within = quote.substring(quotePart.startIdx, quotePart.endIdx + 1);
        lastIndex = quotePart.endIdx + 1;

        parts.push(<span key={`before_${idx}`}>{before}</span>);
        parts.push(
          <span key={`within_${idx}`} className="text-yellow-500">
            {within}
          </span>
        );
      });

    parts.push(<span key={'lastIndex'}>{quote.substring(lastIndex)}</span>);
    return <>{parts}</>;
  }
  return <span>{quote}</span>;
};

const ReorderingCardMainContent = ({ baseQuestion }: { baseQuestion: AnyBaseQuestion }) => {
  const q = baseQuestion as { note?: string; items: Array<{ title: string; explanation: string }> };
  const note = q.note;
  const items = q.items;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm 2xl:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <ol className="list-decimal py-1 pl-5">
        {items.map((item, idx) => (
          <li key={idx} className="hover:font-bold cursor-pointer">
            <Tooltip key={idx} title={item.explanation} placement="right-start" arrow>
              <span>{item.title}</span>
            </Tooltip>
          </li>
        ))}
      </ol>
    </div>
  );
};
