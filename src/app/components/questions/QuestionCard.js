import React from 'react';

import Image from 'next/image';

import { USERS_COLLECTION_REF } from '@/lib/firebase/firestore';

import { doc } from 'firebase/firestore';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { LOCALE_TO_EMOJI } from '@/lib/utils/locales';
import { timestampToDate } from '@/lib/utils/time';
import { prependTopicWithEmoji, topicToEmoji } from '@/lib/utils/topics';

import clsx from 'clsx';
import { MCQ_CHOICES } from '@/lib/utils/question/mcq';
import { QUESTION_ELEMENT_TO_EMOJI } from '@/lib/utils/question/question';

import { CardTitle, CardHeader, CardContent, Card, CardFooter } from '@/app/components/card'

import { Divider, Tooltip } from '@mui/material';

export function QuestionCard({ question }) {

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between' >
                <CardTitle className='text-base md:text-lg dark:text-white'><QuestionCardTitle question={question} /></CardTitle>
            </CardHeader >

            <CardContent>
                <QuestionCardContent question={question} />
            </CardContent>

            <Divider className='my-2 bg-slate-600' />
            <CardFooter>
                <QuestionCardFooter question={question} />
            </CardFooter>

        </Card>


    );
}

export function QuestionCardTitle({ question, lang = 'fr-FR' }) {
    switch (question.type) {
        case 'progressive_clues':
        case 'image':
        case 'emoji':
        case 'blindtest':
        case 'enum':
        case 'odd_one_out':
            return <span>{topicToEmoji(question.topic)} &quot;{question.details.title}&quot;</span>
        case 'matching':
            return <span>{topicToEmoji(question.topic)} <strong>({question.details.numCols} col)</strong> &quot;{question.details.title}&quot;</span>
        case 'quote':
            return <span>{prependTopicWithEmoji(question.topic, lang)}</span>
        case 'mcq':
            return <span>{topicToEmoji(question.topic)} {question.details.source && <i>{question.details.source}:</i>} &quot;{question.details.title}&quot;</span>
    }
}


function QuestionCardFooter({ question, lang = 'fr-FR' }) {
    const userRef = doc(USERS_COLLECTION_REF, question.createdBy)
    const [user, loading, error] = useDocumentDataOnce(userRef)
    if (error) {
        return <p>Error: {JSON.stringify(error)}</p>
    }
    if (loading) {
        return <p>Loading the creator...</p>
    }
    if (!user) {
        return <p>User not found</p>
    }

    return (
        <p className='text-sm md:text-base dark:text-white'>{LOCALE_TO_EMOJI[question.lang]} Created by <strong>{user.name}</strong> ({timestampToDate(question.createdAt, lang)})</p>
    )
}

export function QuestionCardContent({ question }) {
    switch (question.type) {
        case 'progressive_clues':
            return <ProgressiveCluesCardMainContent question={question} />
        case 'image':
            return <ImageCardMainContent question={question} />
        case 'emoji':
            return <EmojiCardMainContent question={question} />
        case 'blindtest':
            return <BlindtestCardMainContent question={question} />
        case 'quote':
            return <QuoteCardMainContent question={question} />
        case 'enum':
            return <EnumCardMainContent question={question} />
        case 'odd_one_out':
            return <OOOCardMainContent question={question} />
        case 'matching':
            return <MatchingCardMainContent question={question} />
        case 'mcq':
            return <MCQCardMainContent question={question} />
        default:
            return <></>
    }
}

const ProgressiveCluesCardMainContent = ({ question }) => {
    const answer = question.details.answer
    return (
        <div className='flex flex-col w-full space-y-2'>
            <Image
                src={answer.image}
                alt={answer.title}
                priority={true}
                height={0}
                width={0}
                style={{
                    width: 'auto',
                    height: '150px',
                    objectFit: 'cover',
                }}
                className='self-center'
            />
            <span className='text-sm md:text-base dark:text-white'><strong>{answer.title}</strong></span>
            <ol className='list-decimal py-1 pl-5'>
                {question.details.clues.map((clue, idx) => <li className='dark:text-white' key={idx}>{clue}</li>)}
            </ol>
        </div>
    );
}

const ImageCardMainContent = ({ question }) => {
    const answer = question.details.answer
    return (
        <div className='flex flex-col w-full space-y-2'>
            <Image
                src={question.details.image}
                alt={answer}
                priority={true}
                height={0}
                width={0}
                style={{
                    width: 'auto',
                    height: '150px',
                    objectFit: 'cover',
                }}
                className='self-center'
            />
            <span className='text-sm md:text-base dark:text-white'><strong>{answer}</strong></span>
        </div>
    );
}

const EmojiCardMainContent = ({ question }) => {
    const { answer: { image, title }, clue } = question.details

    return (
        <div className='flex flex-col w-full space-y-2'>
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
                className='self-center'
            />
            <span className='text-3xl self-center'>{clue}</span>
            <span className='text-sm md:text-base dark:text-white'><strong>{title}</strong></span>
        </div>
    );
}

const BlindtestCardMainContent = ({ question }) => {
    const { answer: { image, title, author, source } } = question.details

    return (
        <div className='flex flex-col w-full space-y-2'>
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
                className='self-center'
            />
            <span className='text-sm md:text-base dark:text-white'><strong>{title}</strong></span>
            {author && <span className='text-sm md:text-base dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['author']} {author}</span>}
            {source && <span className='text-sm md:text-base dark:text-white'><i>{QUESTION_ELEMENT_TO_EMOJI['source']} {source}</i></span>}
            <audio src={question.details.audio} controls className='w-full' />
        </div>
    );
}



const QuoteCardMainContent = ({ question }) => {
    const { quote, source, author, toGuess, quoteParts } = question.details

    return (
        <div className='flex flex-col w-full space-y-2'>
            <blockquote className='text-sm md:text-base dark:text-white'>&quot;{<DisplayedQuote toGuess={toGuess} quote={quote} quoteParts={quoteParts} />}&quot;</blockquote>
            {author && <span className='text-sm md:text-base dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['author']} {<DisplayedAuthor toGuess={toGuess} author={author} />}</span>}
            {source && <span className='text-sm md:text-base dark:text-white'><i>{QUESTION_ELEMENT_TO_EMOJI['source']} {<DisplayedSource toGuess={toGuess} source={source} />}</i></span>}
        </div>
    );
}

const DisplayedAuthor = ({ toGuess, author }) => {
    if (toGuess.includes('author')) {
        return <span className='text-yellow-500'>{author}</span>
    }
    return <span>{author}</span>
}

const DisplayedSource = ({ toGuess, source }) => {
    if (toGuess.includes('source')) {
        return <span className='text-yellow-500'>{source}</span>
    }
    return <span>{source}</span>
}

const DisplayedQuote = ({ toGuess, quote, quoteParts }) => {
    if (toGuess.includes('quote') && quoteParts.length > 0) {
        let parts = []
        let lastIndex = 0

        quoteParts.forEach((quotePart, quotePartIdx) => {
            const before = quote.substring(lastIndex, quotePart.startIdx);
            const within = quote.substring(quotePart.startIdx, quotePart.endIdx + 1);
            lastIndex = quotePart.endIdx + 1;

            parts.push(<span key={`before_${quotePartIdx}`}>{before}</span>);
            parts.push(<span key={quotePartIdx} className='text-yellow-500'>{within}</span>);
        });

        parts.push(<span key={'lastIndex'}>{quote.substring(lastIndex)}</span>);
        return <>{parts}</>;
    }
    return <span>{quote}</span>
}



const ENUM_MAX_NUM_ELEMENTS = 10

const EnumCardMainContent = ({ question }) => {
    const { note, maxIsKnown, thinkingTime, challengeTime, answer } = question.details
    const totalNumElements = answer.length

    return (
        <>
            <div className='flex flex-col w-full space-y-2'>
                <span className='dark: text-white'><strong>{!maxIsKnown && '>='} {totalNumElements}</strong> elements</span>
                <ul className='list-disc py-1 pl-5'>
                    {answer.slice(0, ENUM_MAX_NUM_ELEMENTS).map((element, idx) => <li className='dark: text-white' key={idx}>{element}</li>)}
                    {(totalNumElements > ENUM_MAX_NUM_ELEMENTS || !maxIsKnown) && <li className='dark: text-white' key={ENUM_MAX_NUM_ELEMENTS}>...</li>}
                </ul>
            </div>
            <Divider className='my-2 bg-slate-600' />
            <div className='flex flex-col w-full'>
                <span className='dark: text-white'>🤔 Thinking: <strong>{thinkingTime}s</strong></span>
                <span className='dark: text-white'>🗣️ Enumeration: <strong>{challengeTime}s</strong></span>
            </div>
        </>
    );
}

const OOOCardMainContent = ({ question }) => {
    const { items, answerIdx } = question.details

    return (
        <div className='flex flex-col w-full space-y-2'>
            <ul className='list-disc py-1 pl-5'>
                {items.map((item, idx) => (
                    <li key={idx} className={clsx(idx === answerIdx ? 'text-red-500' : 'dark:text-white', 'hover:font-bold cursor-pointer')}>
                        <Tooltip key={idx} title={item.explanation} placement='right-start' arrow>
                            <span>{item.title}</span>
                        </Tooltip>
                    </li>
                ))}
            </ul>
        </div>
    );

}

const MatchingCardMainContent = ({ question }) => {
    const { answer, numCols } = question.details

    return (
        <div className='flex flex-col w-full space-y-2'>
            {/* <span><strong>{numCols}</strong> columns</span> */}
            <ul className='list-disc py-1 pl-5'>
                {Object.values(answer).map((match, idx) => (
                    <li key={idx}
                        className='dark:text-white'
                    >
                        {match.join(' - ')}
                    </li>
                ))}
            </ul>
        </div>
    );
}

const MCQCardMainContent = ({ question }) => {
    const { source, note, explanation, choices, answerIdx, duoIdx } = question.details

    return (
        <div className='flex flex-col w-full space-y-2'>
            {note && <p className='text-sm md:text-base dark:text-white'>{note}</p>}
            <ul>
                {choices.map((choice, idx) => <li key={idx}
                    className={clsx(
                        idx === answerIdx && 'text-green-500',
                        idx === duoIdx && 'text-blue-500',
                        (idx !== answerIdx && idx !== duoIdx) && 'dark:text-white'
                    )}>
                    {MCQ_CHOICES[idx]}. {choice}
                </li>
                )}
            </ul>
            {explanation && <p className='text-sm md:text-base dark:text-white'>{explanation}</p>}
        </div >
    );
}