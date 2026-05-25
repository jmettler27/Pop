import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { type QuestionType } from '@/models/questions/question-type';

export class BaseBuzzerQuestionRepository extends BaseQuestionRepository {
  constructor(questionType: QuestionType) {
    super(questionType);
  }
}
