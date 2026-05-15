import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/QuestionType';

export default class BaseEstimationQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.ESTIMATION);
  }
}
