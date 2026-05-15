import { runTransaction, serverTimestamp, Transaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { isObjectEmpty } from '@/backend/utils/objects';
import { QuestionType } from '@/models/questions/question-type';
import { QuoteQuestion } from '@/models/questions/quote';
import { PlayerStatus } from '@/models/users/player';

export default class GameQuoteQuestionService extends GameBuzzerQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.QUOTE);
  }

  async resetQuestionTransaction(transaction: Transaction, questionId: string) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const toGuess = baseQuestion.toGuess;
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);

    await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);

    const initialRevealed = (toGuess as string[]).reduce((acc: Record<string, unknown>, elem: string) => {
      acc[elem] = {};
      return acc;
    }, {});
    if ((toGuess as string[]).includes('quote')) {
      initialRevealed['quote'] = (baseQuestion.quoteParts as unknown[]).reduce(
        (acc: Record<number, unknown>, _: unknown, idx: number) => {
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

    console.log(
      'Quote question successfully reset',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async endQuestionTransaction(transaction: Transaction, questionId: string) {
    await super.endQuestionTransaction(transaction, questionId);
    await this.gameQuestionRepo.clearBuzzedPlayersTransaction(transaction, questionId);

    console.log(
      'Quote question successfully ended',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId
    );
  }

  async handleCountdownEndTransaction(transaction: Transaction, questionId: string) {
    const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
    const { buzzed } = questionPlayers;
    const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
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
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        const thinkingTime = gameQuestion.thinkingTime;

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.FOCUS);
        await this.timerRepo.startTimerTransaction(transaction, thinkingTime);

        console.log(
          'Buzzer head change successfully handled',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'type',
          this.questionType,
          'player',
          playerId
        );
      });
    } catch (error) {
      console.error(
        'Failed to handle buzzer head change',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'type',
        this.questionType,
        'err',
        error
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
  async cancelPlayer(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    try {
      await runTransaction(
        firestore,
        async (transaction) => await this.cancelPlayerTransaction(transaction, questionId, playerId)
      );
    } catch (error) {
      console.error(
        'Failed to cancel quote player',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'player',
        playerId,
        'err',
        error
      );
      throw error;
    }
  }

  async cancelPlayerTransaction(transaction: Transaction, questionId: string, playerId: string) {
    await this.gameQuestionRepo.cancelPlayerTransaction(transaction, questionId, playerId);
    await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.WRONG);
    await this.soundRepo.addSoundTransaction(transaction, 'cartoon_mystery_musical_tone_002');
    // this.timerRepo.updateTimerStateTransaction(transaction, gameId, TimerStatus.RESET)

    console.log(
      'Quote player canceled successfully cleared successfully',
      'game',
      this.gameId,
      'round',
      this.roundId,
      'question',
      questionId,
      'type',
      this.questionType
    );
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
  async revealQuoteElement(questionId: string, quoteElem: any, quotePartIdx: number | null = null) {
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
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);

        const playerId = questionPlayers.buzzed[0] || null;

        const newRevealed = gameQuestion.revealed as Record<string, Record<string | number, unknown>>;
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
          if (!player || !round) throw new Error('Player or round not found');
          const teamId = player.teamId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const points = (round as any).rewardsPerElement;

          await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        }

        const toGuess = baseQuestion.toGuess;
        const quoteParts = baseQuestion.quoteParts;

        const temp1 = (toGuess as string[]).every(
          (elem: string) => newRevealed[elem] && !isObjectEmpty(newRevealed[elem] as Record<string, unknown>)
        );
        const newRevealedQuote = newRevealed['quote'];
        const temp2 = (quoteParts as unknown[]).every(
          (_: unknown, idx: number) =>
            newRevealedQuote[idx] && !isObjectEmpty(newRevealedQuote[idx] as Record<string, unknown>)
        );
        const allRevealed = temp1 && temp2;

        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);

        // If all revealed
        if (allRevealed) {
          await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');
          await this.endQuestionTransaction(transaction, questionId);
          console.log(
            'All quote element successfully revealed',
            'game',
            this.gameId,
            'round',
            this.roundId,
            'question',
            questionId,
            'quoteElem',
            quoteElem,
            'quotePartIdx',
            quotePartIdx
          );
          return;
        }
        await this.soundRepo.addSoundTransaction(
          transaction,
          playerId ? 'super_mario_world_coin' : 'cartoon_mystery_musical_tone_002'
        );

        console.log(
          'Quote element successfully revealed',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'quoteElem',
          quoteElem,
          'quotePartIdx',
          quotePartIdx
        );
      });
    } catch (error) {
      console.log(
        'Failed to reveal quote element',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'quoteElem',
        quoteElem,
        'quotePartIdx',
        quotePartIdx,
        'err',
        error
      );
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
  async validateAllQuoteElements(questionId: string, playerId: string) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    try {
      await runTransaction(firestore, async (transaction) => {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);

        const newRevealed = gameQuestion.revealed;
        const toGuess = baseQuestion.toGuess;
        const quoteParts = baseQuestion.quoteParts;

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

        if (!player || !round) throw new Error('Player or round not found');
        /* Update the winner team scores */
        const teamId = player.teamId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rewardsPerElement = (round as any).rewardsPerElement;
        const multiplier =
          (toGuess as string[]).length +
          Number((toGuess as string[]).includes('quote')) * ((quoteParts as unknown[]).length - 1);
        const points = rewardsPerElement * multiplier;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);
        await this.soundRepo.addSoundTransaction(transaction, 'anime_wow');
        await this.endQuestionTransaction(transaction, questionId);

        console.log(
          'All quote elements validated successfully',
          'game',
          this.gameId,
          'round',
          this.roundId,
          'question',
          questionId,
          'player',
          playerId
        );
      });
    } catch (error) {
      console.error(
        'Failed to validate all quote elements',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'player',
        playerId,
        'err',
        error
      );
      throw error;
    }
  }
}
