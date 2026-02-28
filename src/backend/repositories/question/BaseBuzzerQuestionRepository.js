import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

export class BaseBuzzerQuestionRepository extends BaseQuestionRepository {
  constructor(questionType) {
    super(questionType);
  }
}
