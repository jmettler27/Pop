import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

export default class BaseProgressiveCluesQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.PROGRESSIVE_CLUES);
  }
}
