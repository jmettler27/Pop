import { runTransaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameProgressiveCluesQuestionRepository from '@/backend/repositories/question/GameProgressiveCluesQuestionRepository';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { CanceledPlayer } from '@/models/questions/buzzer';
import { GameProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { QuestionType } from '@/models/questions/question-type';
import { ProgressiveCluesRound } from '@/models/rounds/progressive-clues';
import { PlayerStatus } from '@/models/users/player';

export default class GameProgressiveCluesQuestionService extends GameBuzzerQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.PROGRESSIVE_CLUES);
  }

  /* ====================================================================================================== */

  async revealClue(questionId: string) {
    if (!questionId) {
      throw new Error('No question ID has been provided!');
    }

    try {
      await runTransaction(firestore, async (transaction) => {
        const questionPlayers = await (
          this.gameQuestionRepo as GameProgressiveCluesQuestionRepository
        ).getPlayersTransaction(transaction, questionId);
        if (!questionPlayers) {
          console.error(
            'Question players not found',
            'game',
            this.gameId,
            'round',
            this.roundId,
            'question',
            questionId
          );
          throw new Error('Question players not found');
        }

        const { buzzed, canceled } = questionPlayers;

        const gameQuestion = (await this.gameQuestionRepo.getQuestionTransaction(
          transaction,
          questionId
        )) as GameProgressiveCluesQuestion;
        if (!gameQuestion) {
          console.error('Game question not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Game question not found');
        }

        const round = (await this.roundRepo.getRoundTransaction(transaction, this.roundId)) as ProgressiveCluesRound;
        if (!round) {
          console.error('Round not found', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
          throw new Error('Round not found');
        }

        // If there is a buzzed player, update his status to idle
        if (buzzed && buzzed.length > 0) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, buzzed[0], PlayerStatus.IDLE);
          await (this.gameQuestionRepo as GameProgressiveCluesQuestionRepository).clearBuzzedPlayersTransaction(
            transaction,
            questionId
          );
        }
        await (this.gameQuestionRepo as GameProgressiveCluesQuestionRepository).incrementClueTransaction(
          transaction,
          questionId
        );

        // Decancel players who need it
        if (canceled?.length > 0) {
          const targetClueIdx = gameQuestion.currentClueIdx! + 1 - round.delay;
          canceled
            .filter((c: CanceledPlayer) => c.clueIdx === targetClueIdx)
            .forEach((c: CanceledPlayer) => {
              this.playerRepo.updatePlayerStatusTransaction(transaction, c.playerId, PlayerStatus.IDLE);
            });
        }
        // await this.timerRepo.resetTimerTransaction(transaction)
        await this.soundRepo.addSoundTransaction(transaction, 'cartoon_mystery_musical_tone_002');
        console.log('Clue revealed successfully', 'game', this.gameId, 'round', this.roundId, 'question', questionId);
      });
    } catch (error) {
      console.error(
        'Failed to reveal clue',
        'game',
        this.gameId,
        'round',
        this.roundId,
        'question',
        questionId,
        'err',
        error
      );
      throw error;
    }
  }
}
