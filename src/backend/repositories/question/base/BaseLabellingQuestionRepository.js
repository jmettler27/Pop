import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { LabellingQuestion } from '@/backend/models/questions/Labelling';

export default class BaseLabellingQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.LABELLING);
  }
}
