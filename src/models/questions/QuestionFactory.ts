import { BasicQuestion, GameBasicQuestion } from '@/models/questions/basic';
import { BlindtestQuestion, GameBlindtestQuestion } from '@/models/questions/blindtest';
import { BuzzerQuestion, GameBuzzerQuestion } from '@/models/questions/buzzer';
import { EmojiQuestion, GameEmojiQuestion } from '@/models/questions/emoji';
import { EnumerationQuestion, GameEnumerationQuestion } from '@/models/questions/enumeration';
import { EstimationQuestion, GameEstimationQuestion } from '@/models/questions/estimation';
import { GameImageQuestion, ImageQuestion } from '@/models/questions/image';
import { GameLabellingQuestion, LabellingQuestion } from '@/models/questions/labelling';
import { GameMatchingQuestion, MatchingQuestion } from '@/models/questions/matching';
import { GameMCQQuestion, MCQQuestion } from '@/models/questions/mcq';
import { GameNaguiQuestion, NaguiQuestion } from '@/models/questions/nagui';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { GameProgressiveCluesQuestion, ProgressiveCluesQuestion } from '@/models/questions/progressive-clues';
import { type BaseQuestionData, type GameQuestionData } from '@/models/questions/question';
import { QuestionType } from '@/models/questions/question-type';
import { GameQuoteQuestion, QuoteQuestion } from '@/models/questions/quote';
import { GameReorderingQuestion, ReorderingQuestion } from '@/models/questions/reordering';

export type AnyBaseQuestion =
  | BasicQuestion
  | BlindtestQuestion
  | BuzzerQuestion
  | EmojiQuestion
  | EnumerationQuestion
  | EstimationQuestion
  | ImageQuestion
  | LabellingQuestion
  | MatchingQuestion
  | MCQQuestion
  | NaguiQuestion
  | OddOneOutQuestion
  | ProgressiveCluesQuestion
  | QuoteQuestion
  | ReorderingQuestion;

export type AnyGameQuestion =
  | GameBasicQuestion
  | GameBlindtestQuestion
  | GameBuzzerQuestion
  | GameEmojiQuestion
  | GameEnumerationQuestion
  | GameEstimationQuestion
  | GameImageQuestion
  | GameLabellingQuestion
  | GameMatchingQuestion
  | GameMCQQuestion
  | GameNaguiQuestion
  | GameOddOneOutQuestion
  | GameProgressiveCluesQuestion
  | GameQuoteQuestion
  | GameReorderingQuestion;

export default class QuestionFactory {
  static createBaseQuestion(type: QuestionType, data: BaseQuestionData): AnyBaseQuestion {
    switch (type) {
      case QuestionType.BASIC:
        return new BasicQuestion(data);
      case QuestionType.BLINDTEST:
        return new BlindtestQuestion(data);
      case QuestionType.EMOJI:
        return new EmojiQuestion(data);
      case QuestionType.ENUMERATION:
        return new EnumerationQuestion(data);
      case QuestionType.ESTIMATION:
        return new EstimationQuestion(data);
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
        throw new Error(`Unknown question type: ${String(type)}`);
    }
  }

  static createGameQuestion(type: QuestionType, data: GameQuestionData): AnyGameQuestion {
    switch (type) {
      case QuestionType.BASIC:
        return new GameBasicQuestion(data);
      case QuestionType.BLINDTEST:
        return new GameBlindtestQuestion(data);
      case QuestionType.EMOJI:
        return new GameEmojiQuestion(data);
      case QuestionType.ENUMERATION:
        return new GameEnumerationQuestion(data);
      case QuestionType.ESTIMATION:
        return new GameEstimationQuestion(data);
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
        throw new Error(`Unknown question type: ${String(type)}`);
    }
  }
}
