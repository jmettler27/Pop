import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class BaseLabellingQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.LABELLING);
  }
}
