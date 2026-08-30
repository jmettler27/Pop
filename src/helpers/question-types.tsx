import {
  Baby,
  DollarSign,
  Headphones,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  Quote,
  Repeat,
  Ruler,
  Shuffle,
  Smile,
  Tag,
} from 'lucide-react';

import { QuestionType } from '@/models/questions/question-type';
import { RoundType } from '@/models/rounds/round-type';

interface QuestionTypeIconProps {
  questionType: QuestionType;
  className?: string;
}

interface RoundTypeIconProps {
  roundType: RoundType;
  className?: string;
}

export function QuestionTypeIcon({ questionType, className = 'size-5' }: QuestionTypeIconProps) {
  switch (questionType) {
    case QuestionType.BASIC:
      return <HelpCircle className={className} />;
    case QuestionType.BLINDTEST:
      return <Headphones className={className} />;
    case QuestionType.EMOJI:
      return <Smile className={className} />;
    case QuestionType.ENUMERATION:
      return <MessageSquareText className={className} />;
    case QuestionType.ESTIMATION:
      return <Ruler className={className} />;
    case QuestionType.IMAGE:
      return <ImageIcon className={className} />;
    case QuestionType.LABELLING:
      return <Tag className={className} />;
    case QuestionType.MATCHING:
      return <Heart className={className} />;
    case QuestionType.MCQ:
      return <DollarSign className={className} />;
    case QuestionType.NAGUI:
      return <Baby className={className} />;
    case QuestionType.ODD_ONE_OUT:
      return <ListChecks className={className} />;
    case QuestionType.PROGRESSIVE_CLUES:
      return <Lightbulb className={className} />;
    case QuestionType.QUOTE:
      return <Quote className={className} />;
    case QuestionType.REORDERING:
      return <Shuffle className={className} />;
  }
}

export function RoundTypeIcon({ roundType, className = 'size-5' }: RoundTypeIconProps) {
  switch (roundType) {
    case RoundType.MIXED:
      return <Repeat className={className} />;
    default:
      return <QuestionTypeIcon questionType={roundType as unknown as QuestionType} className={className} />;
  }
}
