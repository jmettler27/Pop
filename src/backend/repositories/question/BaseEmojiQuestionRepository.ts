import BaseQuestionRepository from '@/backend/repositories/question/BaseQuestionRepository';
import { QuestionType } from '@/models/questions/question-type';

export default class BaseEmojiQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.EMOJI);
  }
}
