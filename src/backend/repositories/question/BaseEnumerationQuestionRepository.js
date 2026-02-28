import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';

export default class BaseEnumerationQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.ENUMERATION);
  }
}
