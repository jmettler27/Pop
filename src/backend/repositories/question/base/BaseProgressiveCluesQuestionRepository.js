import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ProgressiveCluesQuestion } from '@/backend/models/questions/ProgressiveClues';

export default class BaseProgressiveCluesQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.PROGRESSIVE_CLUES);
  }
}
