import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { ImageQuestion } from '@/backend/models/questions/Image';

export default class BaseImageQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.IMAGE);
  }
}
