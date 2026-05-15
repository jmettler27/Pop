import GameBuzzerQuestionRepository from '@/backend/repositories/question/GameBuzzerQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class GameEmojiQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId: string, roundId: string) {
    super(gameId, roundId, QuestionType.EMOJI);
  }
}
