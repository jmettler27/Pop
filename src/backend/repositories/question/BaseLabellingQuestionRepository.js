import { QuestionType } from '@/backend/models/questions/QuestionType';
import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';

export default class BaseLabellingQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.LABELLING);
  }
}
