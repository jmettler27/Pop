import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

export default class BaseOddOneOutQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.ODD_ONE_OUT);
  }
}
