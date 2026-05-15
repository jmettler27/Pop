import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { QuestionType } from '@/models/questions/QuestionType';

export default class GameBlindtestQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.BLINDTEST);
  }
}
