'use client';

import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import { revealQuoteElement } from '@/backend/services/question/quote/actions';
import { isObjectEmpty } from '@/backend/utils/objects';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { QUESTION_ELEMENT_TO_EMOJI } from '@/frontend/helpers/question';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { GameQuoteQuestion, QuotePart, QuoteQuestion } from '@/models/questions/quote';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

export default function QuoteMiddlePane({ baseQuestion }: { baseQuestion: QuoteQuestion }) {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex h-[10%] items-center justify-center">
        <QuoteQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="flex h-[90%] w-full items-center justify-center">
        <QuoteMainContent baseQuestion={baseQuestion} />
      </div>
    </div>
  );
}

function QuoteQuestionHeader({ baseQuestion }: { baseQuestion: QuoteQuestion }) {
  return (
    <div className="flex flex-row items-center justify-center ">
      <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
      <h1 className="2xl:text-5xl">
        {topicToEmoji(baseQuestion.topic as Topic)}{' '}
        <strong>
          {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
        </strong>
      </h1>
    </div>
  );
}

function QuoteMainContent({ baseQuestion }: { baseQuestion: QuoteQuestion }) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameQuoteQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const gameQuestionData = gameQuestion as unknown as GameQuoteQuestion;
  const revealed = gameQuestionData.revealed;

  const quote = baseQuestion.quote ?? '';
  const source = baseQuestion.source;
  const author = baseQuestion.author;
  const toGuess = baseQuestion.toGuess ?? [];
  const quoteParts = baseQuestion.quoteParts ?? [];

  return (
    <div className="flex flex-col h-full w-2/3 items-center justify-center space-y-5">
      <blockquote className="2xl:text-5xl dark:text-white">
        &quot;
        {<DisplayedQuote toGuess={toGuess} revealed={revealed} quote={quote} quoteParts={quoteParts} />}
        &quot;
      </blockquote>
      {author && (
        <h4 className="2xl:text-5xl dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['author']}{' '}
          {
            <DisplayedQuoteElement
              toGuess={toGuess}
              revealed={revealed}
              quoteElement={author}
              quoteElementStr="author"
            />
          }
        </h4>
      )}
      {source && (
        <h4 className="2xl:text-5xl dark:text-white">
          {QUESTION_ELEMENT_TO_EMOJI['source']}{' '}
          <i>
            {
              <DisplayedQuoteElement
                toGuess={toGuess}
                revealed={revealed}
                quoteElement={source}
                quoteElementStr="source"
              />
            }
          </i>
        </h4>
      )}
    </div>
  );
}

interface DisplayedQuoteElementProps {
  toGuess: string[];
  revealed: Record<string, unknown>;
  quoteElement: string;
  quoteElementStr: string;
}

const DisplayedQuoteElement = ({ toGuess, revealed, quoteElement, quoteElementStr }: DisplayedQuoteElementProps) => {
  const game = useGame();
  const myRole = useRole();

  const [handleQuoteElementClick] = useAsyncAction(async () => {
    if (!game) return;
    await revealQuoteElement(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      quoteElementStr
    );
  });

  const isToGuess = toGuess.includes(quoteElementStr);
  if (!isToGuess) {
    return <span>{quoteElement}</span>;
  }

  const isQuestionEnd = game?.status === GameStatus.QUESTION_END;
  const revealedObj = (revealed[quoteElementStr] ?? {}) as Record<string, unknown>;
  const hasBeenRevealed = !isObjectEmpty(revealedObj);
  const hasBeenRevealedByPlayer = hasBeenRevealed && revealedObj.playerId;

  if (isQuestionEnd || hasBeenRevealedByPlayer) {
    return <span className="text-green-500">{quoteElement}</span>;
  }

  if (hasBeenRevealed) {
    return <span className="text-blue-500">{quoteElement}</span>;
  }

  if (myRole === ParticipantRole.ORGANIZER) {
    return (
      <span
        className="text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50"
        onClick={handleQuoteElementClick}
      >
        {quoteElement}
      </span>
    );
  }

  return <span className="text-yellow-500">???</span>;
};

interface DisplayedQuoteProps {
  toGuess: string[];
  revealed: Record<string, unknown>;
  quote: string;
  quoteParts: QuotePart[];
}

const DisplayedQuote = ({ toGuess, revealed, quote, quoteParts }: DisplayedQuoteProps) => {
  const game = useGame();
  const myRole = useRole();

  const [handleQuotePartClick] = useAsyncAction(async (quotePartIdx: number) => {
    if (!game) return;
    await revealQuoteElement(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      'quote',
      quotePartIdx as unknown as null
    );
  });

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

        if (game?.status === GameStatus.QUESTION_END) {
          parts.push(
            <span key={`answer_${idx}`} className="text-green-500">
              {within}
            </span>
          );
          return;
        }

        const revealedQuoteParts = revealed['quote'] as Record<string, unknown> | undefined;
        const revealedQuotePart = (revealedQuoteParts?.[idx] ?? {}) as Record<string, unknown>;
        const hasBeenRevealed = !isObjectEmpty(revealedQuotePart);
        if (hasBeenRevealed) {
          if (revealedQuotePart.playerId) {
            parts.push(
              <span key={`within_${idx}`} className="text-green-500">
                {within}
              </span>
            );
          } else {
            parts.push(
              <span key={`within_${idx}`} className="text-blue-500">
                {within}
              </span>
            );
          }
        } else if (myRole === ParticipantRole.ORGANIZER) {
          parts.push(
            <span
              key={`within_${idx}`}
              className="text-yellow-500 pointer-events-auto cursor-pointer hover:opacity-50"
              onClick={() => handleQuotePartClick(idx)}
            >
              {within}
            </span>
          );
        } else {
          const replaced = within.replace(/\S/g, '_');
          parts.push(
            <span key={idx} className="text-yellow-500">
              {replaced}
            </span>
          );
        }
      });

    parts.push(<span key={'lastIndex'}>{quote.substring(lastIndex)}</span>);
    return <>{parts}</>;
  }
  return <span>{quote}</span>;
};
