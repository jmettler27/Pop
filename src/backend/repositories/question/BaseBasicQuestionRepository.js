import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class BaseBasicQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.BASIC);
  }
}
