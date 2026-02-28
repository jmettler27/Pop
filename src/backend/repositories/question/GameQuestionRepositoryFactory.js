import { QuestionType } from '@/backend/models/questions/QuestionType';

import GameBasicQuestionRepository from '@/backend/repositories/question/GameBasicQuestionRepository';
import GameBlindtestQuestionRepository from '@/backend/repositories/question/GameBlindtestQuestionRepository';
import GameEmojiQuestionRepository from '@/backend/repositories/question/GameEmojiQuestionRepository';
import GameEnumerationQuestionRepository from '@/backend/repositories/question/GameEnumerationQuestionRepository';
import GameImageQuestionRepository from '@/backend/repositories/question/GameImageQuestionRepository';
import GameLabellingQuestionRepository from '@/backend/repositories/question/GameLabellingQuestionRepository';
import GameMatchingQuestionRepository from '@/backend/repositories/question/GameMatchingQuestionRepository';
import GameMCQQuestionRepository from '@/backend/repositories/question/GameMCQQuestionRepository';
import GameNaguiQuestionRepository from '@/backend/repositories/question/GameNaguiQuestionRepository';
import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import GameProgressiveCluesQuestionRepository from '@/backend/repositories/question/GameProgressiveCluesQuestionRepository';
import GameQuoteQuestionRepository from '@/backend/repositories/question/GameQuoteQuestionRepository';
import GameReorderingQuestionRepository from '@/backend/repositories/question/GameReorderingQuestionRepository';

export default class GameQuestionRepositoryFactory {
  static createRepository(questionType, gameId, roundId) {
    console.log('createRepository', questionType, gameId, roundId);
    switch (questionType) {
      case QuestionType.BASIC:
        return new GameBasicQuestionRepository(gameId, roundId);
      case QuestionType.BLINDTEST:
        return new GameBlindtestQuestionRepository(gameId, roundId);
      case QuestionType.EMOJI:
        return new GameEmojiQuestionRepository(gameId, roundId);
      case QuestionType.ENUMERATION:
        return new GameEnumerationQuestionRepository(gameId, roundId);
      case QuestionType.IMAGE:
        return new GameImageQuestionRepository(gameId, roundId);
      case QuestionType.LABELLING:
        return new GameLabellingQuestionRepository(gameId, roundId);
      case QuestionType.MATCHING:
        return new GameMatchingQuestionRepository(gameId, roundId);
      case QuestionType.MCQ:
        return new GameMCQQuestionRepository(gameId, roundId);
      case QuestionType.NAGUI:
        return new GameNaguiQuestionRepository(gameId, roundId);
      case QuestionType.ODD_ONE_OUT:
        return new GameOddOneOutQuestionRepository(gameId, roundId);
      case QuestionType.PROGRESSIVE_CLUES:
        return new GameProgressiveCluesQuestionRepository(gameId, roundId);
      case QuestionType.QUOTE:
        return new GameQuoteQuestionRepository(gameId, roundId);
      case QuestionType.REORDERING:
        return new GameReorderingQuestionRepository(gameId, roundId);
      default:
        throw new Error(`Unknown question type: ${questionType}`);
    }
  }
}
