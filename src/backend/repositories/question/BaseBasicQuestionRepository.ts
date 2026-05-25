import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class BaseBasicQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.BASIC);
  }
}
