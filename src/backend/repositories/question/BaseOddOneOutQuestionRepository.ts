import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class BaseOddOneOutQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.ODD_ONE_OUT);
  }
}
