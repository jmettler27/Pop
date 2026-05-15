import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { QuestionType } from '@/models/questions/QuestionType';

export default class GameBlindtestQuestionService extends GameBuzzerQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.BLINDTEST);
  }
}
