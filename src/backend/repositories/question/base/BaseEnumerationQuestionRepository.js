import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { EnumerationQuestion } from '@/backend/models/questions/Enumeration';

export default class BaseEnumerationQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.ENUMERATION);
  }
}
