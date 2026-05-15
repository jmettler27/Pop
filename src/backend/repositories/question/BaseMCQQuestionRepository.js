import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/QuestionType';

export default class BaseMCQQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.MCQ);
  }
}
