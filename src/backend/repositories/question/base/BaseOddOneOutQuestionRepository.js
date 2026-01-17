import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { OddOneOutQuestion } from '@/backend/models/questions/OddOneOut';

export default class BaseOddOneOutQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.ODD_ONE_OUT);
  }
}
