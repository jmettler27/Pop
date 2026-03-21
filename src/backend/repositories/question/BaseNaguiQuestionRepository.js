import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

export default class BaseNaguiQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.NAGUI);
  }
}
