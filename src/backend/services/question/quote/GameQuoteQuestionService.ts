import { runTransaction, serverTimestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import { logger } from '@/backend/logger';
import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { isObjectEmpty } from '@/backend/utils/objects';
import { BuzzerQuestionPlayers } from '@/models/questions/buzzer';
import { QuestionType } from '@/models/questions/question-type';
import { GameQuoteQuestion, QuoteQuestion } from '@/models/questions/quote';
import { QuoteRound } from '@/models/rounds/quote';
import { PlayerStatus } from '@/models/users/player';

export default class GameQuoteQuestionService extends GameBuzzerQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.QUOTE);
    this.log = logger.child({ module: 'GameQuoteQuestionService', game: gameId, round: roundId });
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId)) as QuoteQuestion;
    if (!baseQuestion) {
      this.log.warn({ question: questionId }, 'Base question not found');
      throw new Error('Base question not found');
    }
    const toGuess = baseQuestion.toGuess;

    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameQuoteQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    await (this.gameQuestionRepo as GameQuoteQuestionRepository).resetPlayersTransaction(transaction, questionId);

    const initialRevealed = (toGuess as string[]).reduce(
      (acc: Record<string, Record<string, unknown>>, elem: string) => {
        acc[elem] = {};
        return acc;
      },
      {}
    );
    if ((toGuess as string[]).includes('quote')) {
      initialRevealed['quote'] = (baseQuestion.quoteParts as unknown[]).reduce(
        (acc: Record<string, Record<string, unknown>>, _: unknown, idx: number) => {
          acc[idx] = {};
          return acc;
        },
        {}
      );
    }
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      revealed: initialRevealed,
    });

    await this.timerRepo.resetTimerTransaction(transaction, gameQuestion.thinkingTime);

    this.log.info({ question: questionId }, 'Quote question reset');
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    await super.endQuestionTransaction(transaction, questionId);
    await (this.gameQuestionRepo as GameQuoteQuestionRepository).clearBuzzedPlayersTransaction(transaction, questionId);

    this.log.info({ question: questionId }, 'Quote question ended');
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = (await (this.gameQuestionRepo as GameQuoteQuestionRepository).getPlayersTransaction(
      transaction,
      questionId
    )) as BuzzerQuestionPlayers;
    if (!questionPlayers) {
      this.log.warn({ question: questionId }, 'Question players not found');
      throw new Error('Question players not found');
    }

    const { buzzed } = questionPlayers;

    const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
      transaction,
      questionId
    )) as GameQuoteQuestion;
    if (!gameQuestion) {
      this.log.warn({ question: questionId }, 'Game question not found');
      throw new Error('Game question not found');
    }

    const thinkingTime = gameQuestion.thinkingTime;

    if (buzzed.length === 0) {
      await this.timerRepo.resetTimerTransaction(transaction, thinkingTime);
    } else {
      await this.cancelPlayerTransaction(transaction, questionId, buzzed[0]);

      // If there's a next player in the queue, start their countdown
      if (buzzed.length > 1) {
        await this.playerRepo.updatePlayerStatusTransaction(transaction, buzzed[1], PlayerStatus.FOCUS);
        await this.timerRepo.startTimerTransaction(transaction, thinkingTime);
      } else {
        await this.timerRepo.resetTimerTransaction(transaction, thinkingTime);
      }
    }
  }

  /* =============================================================================================================== */
  async handleBuzzerHeadChanged(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    if (!playerId) {
      throw new Error('Player ID is required');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as GameQuoteQuestion;
        if (!gameQuestion) {
          this.log.warn({ question: questionId, type: this.questionType, player: playerId }, 'Game question not found');
          throw new Error('Game question not found');
        }

        const thinkingTime = gameQuestion.thinkingTime;

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);
        await this.timerRepo.startTimerTransaction(transaction, thinkingTime);

        this.log.info(
          { question: questionId, type: this.questionType, player: playerId },
          'Buzzer head change handled'
        );
      });
    } catch (error) {
      this.log.error(
        { question: questionId, type: this.questionType, err: error },
        'Failed to handle buzzer head change'
      );
      throw error;
    }
  }

  /**
   *
   * @param questionId
   * @param playerId
   * @returns {Promise<void>}
   */
  async cancelPlayer(questionId: string, playerId: string): Promise<void> {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    try {
      await runTransaction(
        firestore,
        async (transaction) => await this.cancelPlayerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      this.log.error({ question: questionId, player: playerId, err: error }, 'Failed to cancel quote player');
      throw error;
    }
  }

  async cancelPlayerTransaction(transaction: Transaction, questionId: string, playerId: string) {
    await (this.gameQuestionRepo as GameQuoteQuestionRepository).cancelPlayerTransaction(
      transaction,
      questionId,
      playerId
    );
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
    await this.soundRepo.addWrongAnswerSoundToQueueTransaction(transaction);
    // this.timerRepo.updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)

    this.log.info({ question: questionId, type: this.questionType }, 'Quote player canceled');
  }

  /* =============================================================================================================== */

  /**
   * Reveals a quote element
   *
   * @param questionId the question ID
   * @param quoteElem the quote element to reveal
   * @param quotePartIdx the quote part index (if quoteElem is 'quote')
   * @returns {Promise<void>}
   */
  async revealQuoteElement(questionId: string, quoteElem: any, quotePartIdx: number | null = null): Promise<void> {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!QuoteQuestion.ELEMENTS.includes(quoteElem)) {
      throw new Error('The quote element is not valid!');
    }
    if (quoteElem === 'quote' && quotePartIdx === null) {
      throw new Error('The quote part index is not valid!');
    }
    try {
      await runTransaction(firestore, async (transaction) => {
        const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as QuoteQuestion;
        if (!baseQuestion) {
          this.log.warn({ question: questionId }, 'Base question not found');
          throw new Error('Base question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as QuoteRound;
        if (!round) {
          this.log.warn({ question: questionId }, 'Round not found');
          throw new Error('Round not found');
        }

        const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as GameQuoteQuestion;
        if (!gameQuestion) {
          this.log.warn({ question: questionId }, 'Game question not found');
          throw new Error('Game question not found');
        }

        const questionPlayers = (await (this.gameQuestionRepo as GameQuoteQuestionRepository).getPlayersTransaction(
          transaction,
          questionId
        )) as BuzzerQuestionPlayers;
        if (!questionPlayers) {
          this.log.warn({ question: questionId }, 'Question players not found');
          throw new Error('Question players not found');
        }
        const playerId = questionPlayers.buzzed[0] || null;

        const newRevealed = gameQuestion.revealed;
        if (quoteElem === 'quote') {
          newRevealed[quoteElem][quotePartIdx!] = {
            revealedAt: serverTimestamp(),
            playerId,
          };
        } else {
          newRevealed[quoteElem] = {
            revealedAt: serverTimestamp(),
            playerId,
          } as unknown as Record<string | number, unknown>;
        }

        /* Update the winner team scores */
        if (playerId) {
          const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
          if (!player) {
            this.log.warn({ question: questionId, player: playerId }, 'Player not found');
            throw new Error('Player not found');
          }
          const teamId = player.teamId;
          const points = (round as QuoteRound).rewardsPerElement;

          await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        }

        const toGuess = baseQuestion.toGuess;
        const quoteParts = baseQuestion.quoteParts;

        const temp1 = (toGuess as string[]).every(
          (elem: string) => newRevealed[elem] && !isObjectEmpty(newRevealed[elem])
        );
        const newRevealedQuote = newRevealed['quote'];
        const temp2 = (quoteParts as unknown[]).every(
          (_: unknown, idx: number) =>
            newRevealedQuote[idx] && !isObjectEmpty(newRevealedQuote[idx] as Record<string, unknown>)
        );
        const allRevealed = temp1 && temp2;

        await (this.gameQuestionRepo as GameQuoteQuestionRepository).updateQuestionRevealedElementsTransaction(
          transaction,
          questionId,
          newRevealed
        );

        // If all revealed
        if (allRevealed) {
          await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');
          await this.endQuestionTransaction(transaction, questionId);
          this.log.info({ question: questionId, quoteElem, quotePartIdx }, 'All quote elements revealed');
          return;
        }
        await this.soundRepo.addSoundTransaction(
          transaction,
          playerId ? 'super_mario_world_coin' : 'cartoon_mystery_musical_tone_002'
        );

        this.log.info({ question: questionId, quoteElem, quotePartIdx }, 'Quote element revealed');
      });
    } catch (error) {
      this.log.error({ question: questionId, quoteElem, quotePartIdx, err: error }, 'Failed to reveal quote element');
      throw error;
    }
  }

  /**
   * Reveals all quote elements
   *
   * @param questionId the question ID
   * @param playerId the player ID who guessed
   * @returns {Promise<void>}
   */
  async validateAllQuoteElements(questionId: string, playerId: string): Promise<void> {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    try {
      await runTransaction(firestore, async (transaction) => {
        const baseQuestion = (await this.baseQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as QuoteQuestion;
        if (!baseQuestion) {
          this.log.warn({ question: questionId }, 'Base question not found');
          throw new Error('Base question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as QuoteRound;
        if (!round) {
          this.log.warn({ question: questionId }, 'Round not found');
          throw new Error('Round not found');
        }

        const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as GameQuoteQuestion;
        if (!gameQuestion) {
          this.log.warn({ question: questionId }, 'Game question not found');
          throw new Error('Game question not found');
        }

        const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
        if (!player) {
          this.log.warn({ question: questionId, player: playerId }, 'Player not found');
          throw new Error('Player not found');
        }

        const newRevealed = gameQuestion.revealed!;
        const toGuess = baseQuestion.toGuess!;
        const quoteParts = baseQuestion.quoteParts!;

        const timestamp = serverTimestamp();
        for (const quoteElem of toGuess) {
          if (quoteElem === 'quote') {
            for (let i = 0; i < quoteParts.length; i++) {
              newRevealed[quoteElem][i] = {
                revealedAt: timestamp,
                playerId,
              };
            }
          } else {
            newRevealed[quoteElem] = {
              revealedAt: timestamp,
              playerId,
            };
          }
        }

        /* Update the winner team scores */
        const teamId = player.teamId;
        const rewardsPerElement = (round as QuoteRound).rewardsPerElement;
        const multiplier =
          (toGuess as string[]).length +
          Number((toGuess as string[]).includes('quote')) * ((quoteParts as unknown[]).length - 1);
        const points = rewardsPerElement * multiplier;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        await (this.gameQuestionRepo as GameQuoteQuestionRepository).updateQuestionRevealedElementsTransaction(
          transaction,
          questionId,
          newRevealed
        );
        await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');
        await this.endQuestionTransaction(transaction, questionId);

        this.log.info({ question: questionId, player: playerId }, 'All quote elements validated');
      });
    } catch (error) {
      this.log.error({ question: questionId, player: playerId, err: error }, 'Failed to validate all quote elements');
      throw error;
    }
  }
}
