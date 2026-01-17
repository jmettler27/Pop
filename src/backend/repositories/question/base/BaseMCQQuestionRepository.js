import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { MCQQuestion } from '@/backend/models/questions/MCQ';

export default class BaseMCQQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.MCQ);
  }
}
