import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class BaseMCQQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.MCQ);
  }
}
