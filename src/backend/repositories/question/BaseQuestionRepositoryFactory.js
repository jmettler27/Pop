import { QuestionType } from '@/backend/models/questions/QuestionType';

import BaseBasicQuestionRepository from '@/backend/repositories/question/BaseBasicQuestionRepository';
import BaseBlindtestQuestionRepository from '@/backend/repositories/question/BaseBlindtestQuestionRepository';
import BaseEmojiQuestionRepository from '@/backend/repositories/question/BaseEmojiQuestionRepository';
import BaseEnumerationQuestionRepository from '@/backend/repositories/question/BaseEnumerationQuestionRepository';
import BaseImageQuestionRepository from '@/backend/repositories/question/BaseImageQuestionRepository';
import BaseLabellingQuestionRepository from '@/backend/repositories/question/BaseLabellingQuestionRepository';
import BaseMatchingQuestionRepository from '@/backend/repositories/question/BaseMatchingQuestionRepository';
import BaseMCQQuestionRepository from '@/backend/repositories/question/BaseMCQQuestionRepository';
import BaseNaguiQuestionRepository from '@/backend/repositories/question/BaseNaguiQuestionRepository';
import BaseOddOneOutQuestionRepository from '@/backend/repositories/question/BaseOddOneOutQuestionRepository';
import BaseProgressiveCluesQuestionRepository from '@/backend/repositories/question/BaseProgressiveCluesQuestionRepository';
import BaseQuoteQuestionRepository from '@/backend/repositories/question/BaseQuoteQuestionRepository';
import BaseReorderingQuestionRepository from '@/backend/repositories/question/BaseReorderingQuestionRepository';

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
