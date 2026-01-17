import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { NaguiQuestion } from '@/backend/models/questions/Nagui';

export default class BaseNaguiQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.NAGUI);
  }
}
