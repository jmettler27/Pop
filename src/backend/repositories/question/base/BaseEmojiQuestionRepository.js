import BaseQuestionRepository from '@/backend/repositories/question/base/BaseQuestionRepository';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import { EmojiQuestion } from '@/backend/models/questions/Emoji';

export default class BaseEmojiQuestionRepository extends BaseQuestionRepository {
  constructor() {
    super(QuestionType.EMOJI);
  }
}
