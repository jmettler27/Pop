import { QuestionType } from '@/backend/models/questions/QuestionType';
import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';

export default class GameImageQuestionService extends GameBuzzerQuestionService {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.IMAGE);
  }
}
