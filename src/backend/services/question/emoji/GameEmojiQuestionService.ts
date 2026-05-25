import GameBuzzerQuestionService from '@/backend/services/question/GameBuzzerQuestionService';
import { QuestionType } from '@/models/questions/question-type';

export default class GameEmojiQuestionService extends GameBuzzerQuestionService {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.EMOJI);
  }
}
