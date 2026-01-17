import { QuestionType } from '@/backend/models/questions/QuestionType';

import { BasicQuestion, GameBasicQuestion } from '@/backend/models/questions/Basic';
import { BlindtestQuestion, GameBlindtestQuestion } from '@/backend/models/questions/Blindtest';
import { EmojiQuestion, GameEmojiQuestion } from '@/backend/models/questions/Emoji';
import { EnumerationQuestion, GameEnumerationQuestion } from '@/backend/models/questions/Enumeration';
import { ImageQuestion, GameImageQuestion } from '@/backend/models/questions/Image';
import { LabellingQuestion, GameLabellingQuestion } from '@/backend/models/questions/Labelling';
import { MatchingQuestion, GameMatchingQuestion } from '@/backend/models/questions/Matching';
import { MCQQuestion, GameMCQQuestion } from '@/backend/models/questions/MCQ';
import { NaguiQuestion, GameNaguiQuestion } from '@/backend/models/questions/Nagui';
import { OddOneOutQuestion, GameOddOneOutQuestion } from '@/backend/models/questions/OddOneOut';
import { ProgressiveCluesQuestion, GameProgressiveCluesQuestion } from '@/backend/models/questions/ProgressiveClues';
import { QuoteQuestion, GameQuoteQuestion } from '@/backend/models/questions/Quote';
import { ReorderingQuestion, GameReorderingQuestion } from '@/backend/models/questions/Reordering';

export default class QuestionFactory {
  /**
   * Create a base question
   * @param {string} type - The type of the question
   * @param {Object} data - The data of the question
   * @returns {BaseQuestion} The base question
   */
  static createBaseQuestion(type, data) {
    switch (type) {
      case QuestionType.BASIC:
        return new BasicQuestion(data);
      case QuestionType.BLINDTEST:
        return new BlindtestQuestion(data);
      case QuestionType.EMOJI:
        return new EmojiQuestion(data);
      case QuestionType.ENUMERATION:
        return new EnumerationQuestion(data);
      case QuestionType.IMAGE:
        return new ImageQuestion(data);
      case QuestionType.LABELLING:
        return new LabellingQuestion(data);
      case QuestionType.MATCHING:
        return new MatchingQuestion(data);
      case QuestionType.MCQ:
        return new MCQQuestion(data);
      case QuestionType.NAGUI:
        return new NaguiQuestion(data);
      case QuestionType.ODD_ONE_OUT:
        return new OddOneOutQuestion(data);
      case QuestionType.PROGRESSIVE_CLUES:
        return new ProgressiveCluesQuestion(data);
      case QuestionType.QUOTE:
        return new QuoteQuestion(data);
      case QuestionType.REORDERING:
        return new ReorderingQuestion(data);
      default:
        throw new Error(`Unknown question type: ${type}`);
    }
  }

  /**
   * Create a game question
   * @param {string} type - The type of the question
   * @param {Object} data - The data of the question
   * @returns {GameQuestion} The game question
   */
  static createGameQuestion(type, data) {
    console.log('createGameQuestion', type, data);
    switch (type) {
      case QuestionType.BASIC:
        return new GameBasicQuestion(data);
      case QuestionType.BLINDTEST:
        return new GameBlindtestQuestion(data);
      case QuestionType.EMOJI:
        return new GameEmojiQuestion(data);
      case QuestionType.ENUMERATION:
        return new GameEnumerationQuestion(data);
      case QuestionType.IMAGE:
        return new GameImageQuestion(data);
      case QuestionType.LABELLING:
        return new GameLabellingQuestion(data);
      case QuestionType.MATCHING:
        return new GameMatchingQuestion(data);
      case QuestionType.MCQ:
        return new GameMCQQuestion(data);
      case QuestionType.NAGUI:
        return new GameNaguiQuestion(data);
      case QuestionType.ODD_ONE_OUT:
        return new GameOddOneOutQuestion(data);
      case QuestionType.PROGRESSIVE_CLUES:
        return new GameProgressiveCluesQuestion(data);
      case QuestionType.QUOTE:
        return new GameQuoteQuestion(data);
      case QuestionType.REORDERING:
        return new GameReorderingQuestion(data);
      default:
        throw new Error(`Unknown question type: ${type}`);
    }
  }
}
