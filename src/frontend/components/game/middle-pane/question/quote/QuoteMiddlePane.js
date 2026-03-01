import { revealQuoteElement } from '@/backend/services/question/quote/actions';

import { topicToEmoji } from '@/backend/models/Topic';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { ParticipantRole } from '@/backend/models/users/Participant';

import { isObjectEmpty } from '@/backend/utils/objects';
import { QuestionTypeIcon } from '@/backend/utils/question_types';
import { QUESTION_ELEMENT_TO_EMOJI } from '@/backend/utils/question';

import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';
import { useGameContext, useRoleContext } from '@/frontend/contexts';
import CurrentRoundQuestionOrder from '@/frontend/components/game/middle-pane/question/QuestionHeader';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';

export default function QuoteMiddlePane({ baseQuestion }) {
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

function QuoteQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-row items-center justify-center ">
      <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
      <h1 className="2xl:text-5xl">
        {topicToEmoji(baseQuestion.topic)}{' '}
        <strong>
          {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
        </strong>
      </h1>
    </div>
  );
}

function QuoteMainContent({ baseQuestion }) {
  const game = useGameContext();

  const gameQuestionRepo = new GameQuoteQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, gameQuestionLoading, gameQuestionError } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading) {
    return <LoadingScreen />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const revealed = gameQuestion.revealed;

  const quote = baseQuestion.quote;
  const source = baseQuestion.source;
  const author = baseQuestion.author;
  const toGuess = baseQuestion.toGuess;
  const quoteParts = baseQuestion.quoteParts;

  return (
    <div className="flex flex-col h-full w-2/3 items-center justify-center space-y-5">
      <blockquote className="2xl:text-5xl dark:text-white">
        &quot;{<DisplayedQuote toGuess={toGuess} revealed={revealed} quote={quote} quoteParts={quoteParts} />}&quot;
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

const DisplayedQuoteElement = ({ toGuess, revealed, quoteElement, quoteElementStr }) => {
  const game = useGameContext();
  const myRole = useRoleContext();

  const [handleQuoteElementClick, isSubmitting] = useAsyncAction(async () => {
    await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, quoteElementStr);
  });

  const isToGuess = toGuess.includes(quoteElementStr);
  if (!isToGuess) {
    return <span>{quoteElement}</span>;
  }

  const isQuestionEnd = game.status === GameStatus.QUESTION_END;
  const revealedObj = revealed[quoteElementStr];
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
        disabled={isSubmitting}
      >
        {quoteElement}
      </span>
    );
  }

  return <span className="text-yellow-500">???</span>;
};

const DisplayedQuote = ({ toGuess, revealed, quote, quoteParts }) => {
  const game = useGameContext();
  const myRole = useRoleContext();

  const [handleQuotePartClick, isSubmitting] = useAsyncAction(async (quotePartIdx) => {
    await revealQuoteElement(game.id, game.currentRound, game.currentQuestion, 'quote', quotePartIdx);
  });

  if (toGuess.includes('quote') && quoteParts.length > 0) {
    // We assume that the quote substring index pairs do not overlap and that they are already sorted by startIdx
    let parts = [];
    let lastIndex = 0;

    quoteParts
      .sort((a, b) => a.startIdx - b.startIdx)
      .forEach((quotePart, idx) => {
        const before = quote.substring(lastIndex, quotePart.startIdx);
        const within = quote.substring(quotePart.startIdx, quotePart.endIdx + 1);
        lastIndex = quotePart.endIdx + 1;

        parts.push(<span key={`before_${idx}`}>{before}</span>);

        if (game.status === GameStatus.QUESTION_END) {
          parts.push(
            <span key={`answer_${idx}`} className="text-green-500">
              {within}
            </span>
          );
          return;
        }

        const revealedQuotePart = revealed['quote'][idx];
        const hasBeenRevealed = !isObjectEmpty(revealedQuotePart);
        if (hasBeenRevealed) {
          if (revealedQuotePart.playerId) {
            // Has been found by a player
            parts.push(
              <span key={`within_${idx}`} className="text-green-500">
                {within}
              </span>
            );
          } else {
            // Has been revealed by the organizer
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
              disabled={isSubmitting}
            >
              {within}
            </span>
          );
        } else {
          // Replace all non-space characters of within with underscores
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
