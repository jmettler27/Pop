import { QuoteQuestion } from '@/backend/models/questions/Quote';
import GameQuestionService from '@/backend/services/question/GameQuestionService';
import { runTransaction, serverTimestamp } from 'firebase/firestore';
import { PlayerStatus } from '@/backend/models/users/Player';
import { firestore } from '@/backend/firebase/firebase';
import { QuestionType } from '@/backend/models/questions/QuestionType';
import { isObjectEmpty } from '@/backend/utils/objects';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { TimerStatus } from '@/backend/models/Timer';

export default class GameQuoteQuestionService extends GameBuzzerQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.QUOTE);
  }

  async resetQuestionTransaction(transaction, questionId) {
    const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
    const toGuess = baseQuestion.toGuess;

    await this.gameQuestionRepo.resetPlayersTransaction(transaction, questionId);

    const initialRevealed = toGuess.reduce((acc, elem) => {
      acc[elem] = {};
      return acc;
    }, {});
    if (toGuess.includes('quote')) {
      initialRevealed['quote'] = baseQuestion.quoteParts.reduce((acc, _, idx) => {
        acc[idx] = {};
        return acc;
      }, {});
    }
    await this.gameQuestionRepo.updateQuestionTransaction(transaction, questionId, {
      revealed: initialRevealed,
    });

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

  async endQuestionTransaction(transaction, questionId) {
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

  async handleCountdownEndTransaction(transaction, questionId) {
    const players = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
    const buzzed = players.buzzed;

    if (buzzed.length === 0) {
      await this.timerRepo.updateTimerStatusTransaction(transaction, TimerStatus.RESET);
      // await this.timerRepo.prepareTimerForReadyTransaction(transaction);
    } else {
      await this.cancelPlayerTransaction(transaction, questionId, buzzed[0]);
    }
  }

  /* =============================================================================================================== */

  /**
   *
   * @param questionId
   * @param playerId
   * @returns {Promise<void>}
   */
  async cancelPlayer(questionId, playerId) {
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

  async cancelPlayerTransaction(transaction, questionId, playerId) {
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
  async revealQuoteElement(questionId, quoteElem, quotePartIdx = null) {
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

        const newRevealed = gameQuestion.revealed;
        if (quoteElem === 'quote') {
          newRevealed[quoteElem][quotePartIdx] = {
            revealedAt: serverTimestamp(),
            playerId,
          };
        } else {
          newRevealed[quoteElem] = {
            revealedAt: serverTimestamp(),
            playerId,
          };
        }

        /* Update the winner team scores */
        if (playerId) {
          const player = await this.playerRepo.getPlayerTransaction(transaction, playerId);
          const teamId = player.teamId;
          const points = round.rewardsPerElement;

          await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);
          await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        }

        const toGuess = baseQuestion.toGuess;
        const quoteParts = baseQuestion.quoteParts;

        const temp1 = toGuess.every((elem) => newRevealed[elem] && !isObjectEmpty(newRevealed[elem]));
        const newRevealedQuote = newRevealed['quote'];
        const temp2 = quoteParts.every((_, idx) => newRevealedQuote[idx] && !isObjectEmpty(newRevealedQuote[idx]));
        const allRevealed = temp1 && temp2;

        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);

        // If all revealed
        if (allRevealed) {
          await this.soundRepo.addSoundTransaction(transaction, 'Anime wow');
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
  async validateAllQuoteElements(questionId, playerId) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }
    if (!playerId) {
      throw new Error('No player ID has been provided!');
    }
    try {
      await runTransaction(firestore, async (transaction) => {
        const baseQuestion = await this.baseQuestionRepo.getQuestionTransaction(transaction, questionId);
        const round = await this.roundRepo.getRoundTransaction(transaction, baseQuestion.roundId);
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

        /* Update the winner team scores */
        const teamId = player.teamId;
        const rewardsPerElement = round.rewardsPerElement;
        const multiplier = toGuess.length + toGuess.includes('quote') * (quoteParts.length - 1);
        const points = rewardsPerElement * multiplier;
        await this.roundScoreRepo.increaseTeamScoreTransaction(transaction, questionId, teamId, points);

        await this.playerRepo.updatePlayerStatusTransaction(transaction, playerId, PlayerStatus.CORRECT);
        await this.gameQuestionRepo.updateQuestionRevealedElementsTransaction(transaction, questionId, newRevealed);
        await this.soundRepo.addSoundTransaction(transaction, 'Anime wow');
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
