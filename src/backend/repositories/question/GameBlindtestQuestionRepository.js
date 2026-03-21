import { QuestionType } from '@/backend/models/questions/QuestionType';
import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';

export default class GameBlindtestQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.BLINDTEST);
  }
}
