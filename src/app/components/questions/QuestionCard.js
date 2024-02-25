import React from 'react';

import Image from 'next/image';

import { USERS_COLLECTION_REF } from '@/lib/firebase/firestore';

import { doc } from 'firebase/firestore';
import { useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { LOCALE_TO_EMOJI } from '@/lib/utils/locales';
import { timestampToDate } from '@/lib/utils/time';
import { prependTopicWithEmoji, topicToEmoji } from '@/lib/utils/topics';

import { Divider } from '@mui/material';

export function QuestionCard({ question }) {

    return (
        <div className='relative group overflow-hidden rounded-lg' key={question.id}>
            <div className='bg-white p-4 dark:bg-gray-950'>
                <QuestionCardHeader question={question} />

                <Divider className='my-2 bg-slate-600' />
                <QuestionCardMainContent question={question} />

                <Divider className='my-2 bg-slate-600' />
                <QuestionCardFooter question={question} />
            </div>
        </div>
    );
}

export function QuestionCardHeader({ question, lang = 'en' }) {
    switch (question.type) {
        case 'progressive_clues':
        case 'image':
        case 'emoji':
        case 'blindtest':
        case 'enum':
        case 'odd_one_out':
            return <h3 className='text-base md:text-lg dark:text-white'>{topicToEmoji(question.topic)} &quot;{question.details.title}&quot;</h3>
        case 'matching':
            return <h3 className='text-base md:text-lg dark:text-white'>{topicToEmoji(question.topic)} <strong>({question.details.numCols} col)</strong> &quot;{question.details.title}&quot;</h3>
        case 'quote':
            return <h3 className='text-base md:text-lg dark:text-white'>{prependTopicWithEmoji(question.topic, lang)}</h3>
        case 'mcq':
            return <h3 className='text-base md:text-lg dark:text-white'>{topicToEmoji(question.topic)} {question.details.source && <i>{question.details.source}:</i>} &quot;{question.details.title}&quot;</h3>
    }
}



function QuestionCardFooter({ question, lang = 'en' }) {
    const createdAt = timestampToDate(question.createdAt, lang)

    const userRef = doc(USERS_COLLECTION_REF, question.createdBy)
    const [user, loading, error] = useDocumentDataOnce(userRef)
    if (error) {
        return <p>Error: {error}</p>
    }
    if (loading) {
        return <p>Loading...</p>
    }
    if (!user) {
        return <p>User not found</p>
    }

    return (
        <p className='text-sm md:text-base dark:text-white'>{LOCALE_TO_EMOJI[question.lang]} Created by <strong>{user.name}</strong> ({createdAt})</p>
    )
}

export function QuestionCardMainContent({ question }) {
    switch (question.type) {
        case 'progressive_clues':
            return <ProgressiveCluesMainContent question={question} />
        case 'image':
            return <ImageMainContent question={question} />
        case 'emoji':
            return <EmojiMainContent question={question} />
        case 'blindtest':
            return <BlindtestMainContent question={question} />
        case 'quote':
            return <QuoteMainContent question={question} />
        case 'enum':
            return <EnumMainContent question={question} />
        case 'odd_one_out':
            return <OddOneOutMainContent question={question} />
        case 'matching':
            return <MatchingMainContent question={question} />
        case 'mcq':
            return <MCQMainContent question={question} />
        default:
            return <></>
    }
}

const ProgressiveCluesMainContent = ({ question }) => {
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
            <h4 className='text-sm md:text-base dark:text-white'><strong>{answer.title}</strong></h4>
            <ol className='list-decimal py-1 pl-5'>
                {question.details.clues.map((clue, idx) => <li className='dark:text-white' key={idx}>{clue}</li>)}
            </ol>
        </div>
    );
}

const ImageMainContent = ({ question }) => {
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
            <h4 className='text-sm md:text-base dark:text-white'><strong>{answer}</strong></h4>
        </div>
    );
}

const EmojiMainContent = ({ question }) => {
    const answer = question.details.answer
    // answer.image

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
            <span className='text-3xl self-center'>{question.details.clue}</span>
            <h4 className='text-sm md:text-base dark:text-white'><strong>{answer.title}</strong></h4>
        </div>
    );
}

const BlindtestMainContent = ({ question }) => {
    const answer = question.details.answer
    return (
        <div className='flex flex-col w-full space-y-2'>
            <Image
                src={answer.image}
                alt={answer.source}
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
            <h4 className='text-sm md:text-base dark:text-white'><strong><i>{answer.title}</i> - {answer.author} ({answer.source})</strong></h4>
            <audio src={question.details.audio} controls className='w-full' />
        </div>
    );
}

import { replaceAllNonSpace, replaceSubstrings } from '@/lib/utils/question/quote';
import clsx from 'clsx';
import { MCQ_CHOICES } from '@/lib/utils/question/mcq';

const QuoteMainContent = ({ question }) => {
    const { quote, source, author, toGuess, quoteParts } = question.details

    const displayedAuthor = toGuess.includes('author') ? <span className='text-yellow-500'>{author}</span> : author
    const displayedSource = toGuess.includes('source') ? <span className='text-yellow-500'>{source}</span> : source
    const displayedQuote = toGuess.includes('quote') ? replaceSubstrings(quote, '_', quoteParts) : quote

    return (
        <div className='flex flex-col w-full space-y-2'>
            <blockquote className='text-sm md:text-base dark:text-white'>&quot;{displayedQuote}&quot;</blockquote>
            <h4 className='text-sm md:text-base dark:text-white'>- {displayedAuthor}, <i>{displayedSource}</i></h4>
        </div>
    );
}

const ENUM_MAX_NUM_ELEMENTS = 10

const EnumMainContent = ({ question }) => {
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

const OddOneOutMainContent = ({ question }) => {
    const { items, answerIdx } = question.details

    return (
        <div className='flex flex-col w-full space-y-2'>
            <ul className='list-disc py-1 pl-5'>
                {items.map((item, idx) => (
                    <li key={idx}
                        className={clsx(idx === answerIdx ? 'text-red-500' : 'dark:text-white')}
                    >
                        {item.title}
                    </li>
                ))}
            </ul>
        </div>
    );

}

const MatchingMainContent = ({ question }) => {
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

const MCQMainContent = ({ question }) => {
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