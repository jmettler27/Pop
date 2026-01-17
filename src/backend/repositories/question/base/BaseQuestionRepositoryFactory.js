import { QuestionType } from '@/backend/models/questions/QuestionType';

import BaseBasicQuestionRepository from '@/backend/repositories/question/base/BaseBasicQuestionRepository';
import BaseBlindtestQuestionRepository from '@/backend/repositories/question/base/BaseBlindtestQuestionRepository';
import BaseEmojiQuestionRepository from '@/backend/repositories/question/base/BaseEmojiQuestionRepository';
import BaseEnumerationQuestionRepository from '@/backend/repositories/question/base/BaseEnumerationQuestionRepository';
import BaseImageQuestionRepository from '@/backend/repositories/question/base/BaseImageQuestionRepository';
import BaseLabellingQuestionRepository from '@/backend/repositories/question/base/BaseLabellingQuestionRepository';
import BaseMatchingQuestionRepository from '@/backend/repositories/question/base/BaseMatchingQuestionRepository';
import BaseMCQQuestionRepository from '@/backend/repositories/question/base/BaseMCQQuestionRepository';
import BaseNaguiQuestionRepository from '@/backend/repositories/question/base/BaseNaguiQuestionRepository';
import BaseOddOneOutQuestionRepository from '@/backend/repositories/question/base/BaseOddOneOutQuestionRepository';
import BaseProgressiveCluesQuestionRepository from '@/backend/repositories/question/base/BaseProgressiveCluesQuestionRepository';
import BaseQuoteQuestionRepository from '@/backend/repositories/question/base/BaseQuoteQuestionRepository';
import BaseReorderingQuestionRepository from '@/backend/repositories/question/base/BaseReorderingQuestionRepository';

export default class BaseQuestionRepositoryFactory {
  static createRepository(questionType) {
    switch (questionType) {
      case QuestionType.BASIC:
        return new BaseBasicQuestionRepository();
      case QuestionType.BLINDTEST:
        return new BaseBlindtestQuestionRepository();
      case QuestionType.EMOJI:
        return new BaseEmojiQuestionRepository();
      case QuestionType.ENUMERATION:
        return new BaseEnumerationQuestionRepository();
      case QuestionType.IMAGE:
        return new BaseImageQuestionRepository();
      case QuestionType.LABELLING:
        return new BaseLabellingQuestionRepository();
      case QuestionType.MATCHING:
        return new BaseMatchingQuestionRepository();
      case QuestionType.MCQ:
        return new BaseMCQQuestionRepository();
      case QuestionType.NAGUI:
        return new BaseNaguiQuestionRepository();
      case QuestionType.ODD_ONE_OUT:
        return new BaseOddOneOutQuestionRepository();
      case QuestionType.PROGRESSIVE_CLUES:
        return new BaseProgressiveCluesQuestionRepository();
      case QuestionType.QUOTE:
        return new BaseQuoteQuestionRepository();
      case QuestionType.REORDERING:
        return new BaseReorderingQuestionRepository();
      default:
        throw new Error(`Unknown question type: ${questionType}`);
    }
  }
}
