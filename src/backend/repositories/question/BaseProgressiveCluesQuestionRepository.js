import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class BaseProgressiveCluesQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.PROGRESSIVE_CLUES);
  }
}
