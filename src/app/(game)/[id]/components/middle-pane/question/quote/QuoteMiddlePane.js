import { useGameContext, useRoleContext } from '@/app/(game)/contexts'

import { CurrentRoundQuestionOrder } from '@/app/(game)/[id]/components/middle-pane/question/QuestionHeader'

import { questionTypeToTitle, QuestionTypeIcon } from '@/lib/utils/question_types'
import { topicToEmoji } from '@/lib/utils/topics'
import { doc } from 'firebase/firestore'
import { GAMES_COLLECTION_REF } from '@/lib/firebase/firestore'
import { useDocumentData } from 'react-firebase-hooks/firestore'
import LoadingScreen from '@/app/components/LoadingScreen'
import { useAsyncAction } from '@/lib/utils/async'
import { isObjectEmpty } from '@/lib/utils'
import { revealQuoteElement } from '@/app/(game)/lib/question/quote'
import { QUESTION_ELEMENT_TO_EMOJI } from '@/lib/utils/question/question'


export default function QuoteMiddlePane({ question }) {
    return (
        <div className='flex flex-col h-full items-center'>
            <div className='flex h-[10%] items-center justify-center'>
                <QuoteQuestionHeader question={question} />
            </div>
            <div className='flex h-[90%] w-full items-center justify-center'>
                <QuoteMainContent question={question} />
            </div>
        </div>
    )
}


function QuoteQuestionHeader({ question }) {
    return (
        <div className='flex flex-row items-center justify-center '>
            <QuestionTypeIcon questionType={question.type} fontSize={50} />
            <h1 className='2xl:text-5xl'>{topicToEmoji(question.topic)} <strong>{questionTypeToTitle(question.type)} <CurrentRoundQuestionOrder /></strong></h1>
        </div>
    )
}

function QuoteMainContent({ question }) {
    const game = useGameContext()

    const realtimeDocRef = doc(GAMES_COLLECTION_REF, game.id, 'rounds', game.currentRound, 'questions', game.currentQuestion)
    const [realtime, realtimeLoading, realtimeError] = useDocumentData(realtimeDocRef)
    if (realtimeError) {
        return <p><strong>Error: {JSON.stringify(realtimeError)}</strong></p>
    }
    if (realtimeLoading) {
        return <LoadingScreen />
    }
    if (!realtime) {
        return <></>
    }

    const { revealed } = realtime
    const { quote, source, author, toGuess, quoteParts } = question.details

    return (
        <div className='flex flex-col h-full w-2/3 items-center justify-center space-y-5'>
            <blockquote className='2xl:text-3xl md:text-5xl dark:text-white'>&quot;{<DisplayedQuote toGuess={toGuess} revealed={revealed} quote={quote} quoteParts={quoteParts} />}&quot;</blockquote>
            {author && <h4 className='2xl:text-3xl md:text-5xl dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['author']} {<DisplayedAuthor toGuess={toGuess} revealed={revealed} author={author} />}</h4>}
            {source && <h4 className='2xl:text-3xl md:text-5xl dark:text-white'>{QUESTION_ELEMENT_TO_EMOJI['source']} <i>{<DisplayedSource toGuess={toGuess} revealed={revealed} source={source} />}</i></h4>}
        </div>
    );
}


const DisplayedAuthor = ({ toGuess, revealed, author }) => {
    const game = useGameContext()
    const myRole = useRoleContext()

    const [handleAuthorClick, isSubmitting] = useAsyncAction(async () => {
        await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, 'author')
    })

    if (toGuess.includes('author')) {
        if (game.status === 'question_end') {
            return <span className='2xl:text-green-500'>{author}</span>
        }
        const revealedObj = revealed['author']
        const hasBeenRevealed = !isObjectEmpty(revealedObj)
        if (hasBeenRevealed) {
            if (revealedObj.playerId) {
                return <span className='2xl:text-green-500'>{author}</span>
            } else {
                return <span className='2xl:text-blue-500'>{author}</span>
            }
        } else if (myRole === 'organizer') {
            return <span className='2xl:text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50' onClick={handleAuthorClick} disabled={isSubmitting}>{author}</span>
        }
        return <span className='2xl:text-yellow-500'>???</span>
    }
    return <span>{author}</span>
}

const DisplayedSource = ({ toGuess, revealed, source }) => {
    const game = useGameContext()
    const myRole = useRoleContext()

    const [handleSourceClick, isSubmitting] = useAsyncAction(async () => {
        await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, 'source')
    })

    if (toGuess.includes('source')) {
        if (game.status === 'question_end') {
            return <span className='2xl:text-green-500'>{source}</span>
        }
        const revealedObj = revealed['source']
        const hasBeenRevealed = !isObjectEmpty(revealedObj)
        if (hasBeenRevealed) {
            if (revealedObj.playerId) {
                return <span className='2xl:text-green-500'>{source}</span>
            } else {
                return <span className='2xl:text-blue-500'>{source}</span>
            }
        } else if (myRole === 'organizer') {
            return <span className='2xl:text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50' onClick={handleSourceClick} disabled={isSubmitting}>{source}</span>
        }
        return <span className='2xl:text-yellow-500'>???</span>
    }
    return <span>{source}</span>
}

const DisplayedQuote = ({ toGuess, revealed, quote, quoteParts }) => {
    const game = useGameContext()
    const myRole = useRoleContext()

    const [handleQuotePartClick, isSubmitting] = useAsyncAction(async (quotePartIdx) => {
        await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, 'quote', quotePartIdx)
    })

    if (toGuess.includes('quote') && quoteParts.length > 0) {
        // We assume that the quote substring index pairs do not overlap and that they are already sorted by startIdx
        let parts = []
        let lastIndex = 0

        // quoteParts.sort((a, b) => a.startIdx - b.startIdx).forEach((quotePart, index) => {
        quoteParts.forEach((quotePart, quotePartIdx) => {
            const before = quote.substring(lastIndex, quotePart.startIdx);
            const within = quote.substring(quotePart.startIdx, quotePart.endIdx + 1);
            lastIndex = quotePart.endIdx + 1;

            parts.push(<span key={`before_${quotePartIdx}`}>{before}</span>);

            if (game.status === 'question_end') {
                parts.push(<span key={`answer_${quotePartIdx}`} className='2xl:text-green-500'>{within}</span>);
                return
            }

            const revealedQuotePart = revealed['quote'][quotePartIdx];
            const hasBeenRevealed = !isObjectEmpty(revealedQuotePart)
            if (hasBeenRevealed) {
                if (revealedQuotePart.playerId) { // Has been found by a player
                    parts.push(<span key={quotePartIdx} className='2xl:text-green-500'>{within}</span>);
                } else { // Has been revealed by the organizer
                    parts.push(<span key={quotePartIdx} className='2xl:text-blue-500'>{within}</span>);
                }
            } else if (myRole === 'organizer') {
                parts.push(<span key={quotePartIdx} className='2xl:text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50' onClick={() => handleQuotePartClick(quotePartIdx)} disabled={isSubmitting}>{within}</span>);
            } else {
                // Replace all non-space characters of within with underscores
                const replaced = within.replace(/\S/g, '_');
                parts.push(<span key={quotePartIdx} className='2xl:text-yellow-500'>{replaced}</span>);
            }
        });

        parts.push(<span key={'lastIndex'}>{quote.substring(lastIndex)}</span>);
        return <>{parts}</>;
    }
    return <span>{quote}</span>
}
