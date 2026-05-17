import { runTransaction } from 'firebase/firestore';

import { firestore } from '@/backend/firebase/firebase';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { CanceledPlayer } from '@/models/questions/buzzer';
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
        const questionPlayers = await this.gameQuestionRepo.getPlayersTransaction(transaction, questionId);
        if (!questionPlayers) {
          console.log();
          throw new Error();
        }

        const { buzzed, canceled } = questionPlayers;

        const gameQuestion = await this.gameQuestionRepo.getQuestionTransaction(transaction, questionId);
        if (!gameQuestion) {
          console.log();
          throw new Error();
        }

        const round = await this.roundRepo.getRoundTransaction(transaction, this.roundId);
        if (!round) {
          console.log();
          throw new Error();
        }
        const progressiveCluesRound = round as ProgressiveCluesRound;

        // If there is a buzzed player, update his status to idle
        if (buzzed && buzzed.length > 0) {
          await this.playerRepo.updatePlayerStatusTransaction(transaction, buzzed[0], PlayerStatus.IDLE);
          await this.gameQuestionRepo.clearBuzzedPlayersTransaction(transaction, questionId);
        }
        await this.gameQuestionRepo.incrementClueTransaction(transaction, questionId);

        // Decancel players who need it
        if (canceled?.length > 0) {
          const targetClueIdx = gameQuestion.currentClueIdx + 1 - progressiveCluesRound.delay;
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
