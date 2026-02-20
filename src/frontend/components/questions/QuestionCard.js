import UserRepository from '@/backend/repositories/user/UserRepository';

import { QuestionType, questionTypeToEmoji } from '@/backend/models/questions/QuestionType';
import { BlindtestQuestion } from '@/backend/models/questions/Blindtest';
import { MCQQuestion } from '@/backend/models/questions/MCQ';
import { NaguiQuestion } from '@/backend/models/questions/Nagui';
import { prependTopicWithEmoji, topicToEmoji } from '@/backend/models/Topic';

import { QUESTION_ELEMENT_TO_EMOJI, QUESTION_ELEMENT_TO_TITLE } from '@/backend/utils/question/question';
import { timestampToDate } from '@/backend/utils/time';

import { DEFAULT_LOCALE, LOCALE_TO_EMOJI } from '@/frontend/utils/locales';

import { CardTitle, CardHeader, CardContent, Card, CardFooter } from '@/frontend/components/card';

import Image from 'next/image';

import React from 'react';

import clsx from 'clsx';

import { Divider, Tooltip } from '@mui/material';

export function QuestionCard({ baseQuestion, showType = false }) {
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

export function QuestionCardTitle({ baseQuestion, showType = false, lang = DEFAULT_LOCALE }) {
  const emoji = questionTypeToEmoji(baseQuestion.type);

  switch (baseQuestion.type) {
    case QuestionType.BLINDTEST:
      return (
        <span>
          {showType && emoji}
          {BlindtestQuestion.typeToEmoji(baseQuestion.subtype)}
          {topicToEmoji(baseQuestion.topic)} &quot;{baseQuestion.title}&quot;
        </span>
      );
    case QuestionType.MATCHING:
      return (
        <span>
          {showType && emoji}
          {topicToEmoji(baseQuestion.topic)} <strong>({baseQuestion.numCols} col)</strong> &quot;{baseQuestion.title}
          &quot;
        </span>
      );
    case QuestionType.EMOJI:
    case QuestionType.ENUMERATION:
    case QuestionType.IMAGE:
    case QuestionType.LABELLING:
    case QuestionType.ODD_ONE_OUT:
    case QuestionType.PROGRESSIVE_CLUES:
    case QuestionType.QUOTE:
      return (
        <span>
          {showType && emoji}
          {prependTopicWithEmoji(baseQuestion.topic, lang)}
        </span>
      );
    case QuestionType.REORDERING:
      return (
        <span>
          {showType && emoji}
          {topicToEmoji(baseQuestion.topic)} &quot;{baseQuestion.title}&quot;
        </span>
      );
    case QuestionType.BASIC:
    case QuestionType.MCQ:
    case QuestionType.NAGUI:
      return (
        <span>
          {showType && emoji}
          {topicToEmoji(baseQuestion.topic)} {baseQuestion.source && <i>{baseQuestion.source}:</i>} &quot;
          {baseQuestion.title}&quot;
        </span>
      );
  }
}

function QuestionCardFooter({ baseQuestion, lang = DEFAULT_LOCALE }) {
  const userRepository = new UserRepository();
  const { user, loading, error } = userRepository.useUserOnce(baseQuestion.createdBy);
  if (error) {
    return <p>Error: {JSON.stringify(error)}</p>;
  }
  if (loading) {
    return <p>Loading the creator...</p>;
  }
  if (!user) {
    return <p>User not found</p>;
  }

  return (
    <p className="text-xs sm:text-sm lg:text-base dark:text-white">
      {LOCALE_TO_EMOJI[baseQuestion.lang]} {QUESTION_ELEMENT_TO_TITLE[lang]['createdBy']} <strong>{user.name}</strong> (
      {timestampToDate(baseQuestion.createdAt, lang)})
    </p>
  );
}

export function QuestionCardContent({ baseQuestion }) {
  switch (baseQuestion.type) {
    case QuestionType.BASIC:
      return <BasicCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.BLINDTEST:
      return <BlindtestCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.EMOJI:
      return <EmojiCardMainContent baseQuestion={baseQuestion} />;
    case QuestionType.ENUMERATION:
      return <EnumCardMainContent baseQuestion={baseQuestion} />;
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

const ProgressiveCluesCardMainContent = ({ baseQuestion }) => {
  const clues = baseQuestion.clues;
  const image = baseQuestion.answer.image;
  const title = baseQuestion.answer.title;

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
      <span className="text-xs sm:text-sm lg:text-base dark:text-white">
        <strong>{title}</strong>
      </span>
      <ol className="list-decimal py-1 pl-5">
        {clues.map((clue, idx) => (
          <li className="dark:text-white" key={idx}>
            {clue}
          </li>
        ))}
      </ol>
    </div>
  );
};

const ImageCardMainContent = ({ baseQuestion }) => {
  const image = baseQuestion.image;
  const description = baseQuestion.answer.description;
  const source = baseQuestion.answer.source;
  console.log('baseQuestion', baseQuestion);

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
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['description']} {description}
        </span>
      )}
      <span className="text-xs sm:text-sm lg:text-base dark:text-white">
        {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
      </span>
    </div>
  );
};

const EmojiCardMainContent = ({ baseQuestion }) => {
  const image = baseQuestion.answer.image;
  const title = baseQuestion.answer.title;
  const clue = baseQuestion.clue;

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
      <span className="text-xs sm:text-sm lg:text-base dark:text-white">
        <strong>{title}</strong>
      </span>
    </div>
  );
};

const BlindtestCardMainContent = ({ baseQuestion }) => {
  const audio = baseQuestion.audio;
  const answer = baseQuestion.answer;
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
      <span className="text-xs sm:text-sm lg:text-base dark:text-white">
        <strong>{title}</strong>
      </span>
      {author && (
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['author']} {author}
        </span>
      )}
      {source && (
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{source}</i>
        </span>
      )}
      <audio src={audio} controls className="w-full" />
    </div>
  );
};

const QuoteCardMainContent = ({ baseQuestion }) => {
  const quote = baseQuestion.quote;
  const source = baseQuestion.source;
  const author = baseQuestion.author;
  const toGuess = baseQuestion.toGuess;
  const quoteParts = baseQuestion.quoteParts;

  return (
    <div className="flex flex-col w-full space-y-2">
      <blockquote className="text-xs sm:text-sm lg:text-base dark:text-white">
        &quot;{<DisplayedQuote toGuess={toGuess} quote={quote} quoteParts={quoteParts} />}&quot;
      </blockquote>
      {author && (
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['author']} {<DisplayedAuthor toGuess={toGuess} author={author} />}
        </span>
      )}
      {source && (
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['source']} <i>{<DisplayedSource toGuess={toGuess} source={source} />}</i>
        </span>
      )}
    </div>
  );
};

const DisplayedAuthor = ({ toGuess, author }) => {
  if (toGuess.includes('author')) {
    return <span className="text-yellow-500">{author}</span>;
  }
  return <span>{author}</span>;
};

const DisplayedSource = ({ toGuess, source }) => {
  if (toGuess.includes('source')) {
    return <span className="text-yellow-500">{source}</span>;
  }
  return <span>{source}</span>;
};

const DisplayedQuote = ({ toGuess, quote, quoteParts }) => {
  if (toGuess.includes('quote') && quoteParts.length > 0) {
    let parts = [];
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

const LabellingCardMainContent = ({ baseQuestion }) => {
  const title = baseQuestion.title;
  const image = baseQuestion.image;
  const labels = baseQuestion.labels;

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
          <li className="dark:text-white" key={idx}>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
};

const ENUM_MAX_NUM_ELEMENTS = 10;

const EnumCardMainContent = ({ baseQuestion, lang = DEFAULT_LOCALE }) => {
  const note = baseQuestion.note;
  const maxIsKnown = baseQuestion.maxIsKnown;
  const thinkingTime = baseQuestion.thinkingTime;
  const challengeTime = baseQuestion.challengeTime;
  const answer = baseQuestion.answer;

  const totalNumElements = answer.length;

  return (
    <>
      <div className="flex flex-col w-full space-y-2">
        {note && (
          <p className="text-xs sm:text-sm lg:text-base dark:text-white italic">
            {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
          </p>
        )}
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          <strong>
            {!maxIsKnown && '>='} {totalNumElements}
          </strong>{' '}
          elements
        </span>
        <ul className="list-disc py-1 pl-5">
          {answer.slice(0, ENUM_MAX_NUM_ELEMENTS).map((element, idx) => (
            <li className="dark:text-white" key={idx}>
              {element}
            </li>
          ))}
          {(totalNumElements > ENUM_MAX_NUM_ELEMENTS || !maxIsKnown) && (
            <li className="dark:text-white" key={ENUM_MAX_NUM_ELEMENTS}>
              ...
            </li>
          )}
        </ul>
      </div>
      <Divider className="my-2 bg-slate-600" />
      <div className="flex flex-col w-full">
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          🤔 {ENUM_THINKING[lang]}: <strong>{thinkingTime}s</strong>
        </span>
        <span className="text-xs sm:text-sm lg:text-base dark:text-white">
          🗣️ {ENUM_ENUMERATION[lang]}: <strong>{challengeTime}s</strong>
        </span>
      </div>
    </>
  );
};

const ENUM_THINKING = {
  en: 'Thinking',
  'fr-FR': 'Réflexion',
};

const ENUM_ENUMERATION = {
  en: 'Enumeration',
  'fr-FR': 'Énumération',
};

const OOOCardMainContent = ({ baseQuestion }) => {
  const note = baseQuestion.note;
  const items = baseQuestion.items;
  const answerIdx = baseQuestion.answerIdx;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm lg:text-base dark:text-white italic">
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

const ReorderingCardMainContent = ({ baseQuestion }) => {
  const note = baseQuestion.note;
  const items = baseQuestion.items;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm lg:text-base dark:text-white italic">
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

const MatchingCardMainContent = ({ baseQuestion }) => {
  const note = baseQuestion.note;
  const answer = baseQuestion.answer;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm lg:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <ul className="list-disc py-1 pl-5">
        {Object.values(answer).map((match, idx) => (
          <li key={idx} className="dark:text-white">
            {match.join(' - ')}
          </li>
        ))}
      </ul>
    </div>
  );
};

const MCQCardMainContent = ({ baseQuestion }) => {
  const note = baseQuestion.note;
  const choices = baseQuestion.choices;
  const answerIdx = baseQuestion.answerIdx;
  const explanation = baseQuestion.explanation;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm lg:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <ul>
        {choices.map((choice, idx) => (
          <li key={idx} className={clsx(idx === answerIdx ? 'text-green-500' : 'dark:text-white')}>
            {MCQQuestion.CHOICES[idx]}. {choice}
          </li>
        ))}
      </ul>
      {explanation && <p className="text-xs sm:text-sm lg:text-base dark:text-white">👉 {explanation}</p>}
    </div>
  );
};

const NaguiCardMainContent = ({ baseQuestion }) => {
  const note = baseQuestion.note;
  const choices = baseQuestion.choices;
  const answerIdx = baseQuestion.answerIdx;
  const duoIdx = baseQuestion.duoIdx;
  const explanation = baseQuestion.explanation;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm lg:text-base dark:text-white italic">
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
      {explanation && <p className="text-xs sm:text-sm lg:text-base dark:text-white">👉 {explanation}</p>}
    </div>
  );
};

const BasicCardMainContent = ({ baseQuestion }) => {
  const note = baseQuestion.note;
  const answer = baseQuestion.answer;
  const explanation = baseQuestion.explanation;

  return (
    <div className="flex flex-col w-full space-y-2">
      {note && (
        <p className="text-xs sm:text-sm lg:text-base dark:text-white italic">
          {QUESTION_ELEMENT_TO_EMOJI['note']} {note}
        </p>
      )}
      <span className="text-xs sm:text-sm lg:text-base dark:text-white">{answer}</span>
      {explanation && <p className="text-xs sm:text-sm lg:text-base dark:text-white">👉 {explanation}</p>}
    </div>
  );
};
