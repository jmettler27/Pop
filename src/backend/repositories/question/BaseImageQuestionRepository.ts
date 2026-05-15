import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class BaseImageQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.IMAGE);
  }
}
