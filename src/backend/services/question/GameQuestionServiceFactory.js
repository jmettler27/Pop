import { QuestionType } from '@/backend/models/questions/QuestionType';
import GameBasicQuestionService from '@/backend/services/question/basic/GameBasicQuestionService';
import GameBlindtestQuestionService from '@/backend/services/question/blindtest/GameBlindtestQuestionService';
import GameEmojiQuestionService from '@/backend/services/question/emoji/GameEmojiQuestionService';
import GameEnumerationQuestionService from '@/backend/services/question/enumeration/GameEnumerationQuestionService';
import GameImageQuestionService from '@/backend/services/question/image/GameImageQuestionService';
import GameLabellingQuestionService from '@/backend/services/question/labelling/GameLabellingQuestionService';
import GameMatchingQuestionService from '@/backend/services/question/matching/GameMatchingQuestionService';
import GameMCQQuestionService from '@/backend/services/question/mcq/GameMCQQuestionService';
import GameNaguiQuestionService from '@/backend/services/question/nagui/GameNaguiQuestionService';
import GameOddOneOutQuestionService from '@/backend/services/question/odd-one-out/GameOddOneOutQuestionService';
import GameProgressiveCluesQuestionService from '@/backend/services/question/progressive-clues/GameProgressiveCluesQuestionService';
import GameQuoteQuestionService from '@/backend/services/question/quote/GameQuoteQuestionService';
import GameReorderingQuestionService from '@/backend/services/question/reordering/GameReorderingQuestionService';

export default class GameQuestionServiceFactory {
  static createService(questionType, gameId, roundId) {
    console.log('createService', questionType, gameId, roundId);
    switch (questionType) {
      case QuestionType.BASIC:
        return new GameBasicQuestionService(gameId, roundId);
      case QuestionType.BLINDTEST:
        return new GameBlindtestQuestionService(gameId, roundId);
      case QuestionType.EMOJI:
        return new GameEmojiQuestionService(gameId, roundId);
      case QuestionType.ENUMERATION:
        return new GameEnumerationQuestionService(gameId, roundId);
      case QuestionType.IMAGE:
        return new GameImageQuestionService(gameId, roundId);
      case QuestionType.LABELLING:
        return new GameLabellingQuestionService(gameId, roundId);
      case QuestionType.MATCHING:
        return new GameMatchingQuestionService(gameId, roundId);
      case QuestionType.MCQ:
        return new GameMCQQuestionService(gameId, roundId);
      case QuestionType.NAGUI:
        return new GameNaguiQuestionService(gameId, roundId);
      case QuestionType.ODD_ONE_OUT:
        return new GameOddOneOutQuestionService(gameId, roundId);
      case QuestionType.PROGRESSIVE_CLUES:
        return new GameProgressiveCluesQuestionService(gameId, roundId);
      case QuestionType.QUOTE:
        return new GameQuoteQuestionService(gameId, roundId);
      case QuestionType.REORDERING:
        return new GameReorderingQuestionService(gameId, roundId);
      default:
        throw new Error(`Unknown question type: ${questionType}`);
    }
  }
}
