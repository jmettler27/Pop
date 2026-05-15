import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class BaseReorderingQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.REORDERING);
  }
}
