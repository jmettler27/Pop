import GameBuzzerQuestionRepository from '@/backend/repositories/question/game/GameBuzzerQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class GameImageQuestionRepository extends GameBuzzerQuestionRepository {
  constructor(gameId, roundId) {
    super(gameId, roundId, QuestionType.IMAGE);
  }
}
