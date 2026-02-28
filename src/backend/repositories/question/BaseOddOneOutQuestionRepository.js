import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class BaseOddOneOutQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.ODD_ONE_OUT);
  }
}
