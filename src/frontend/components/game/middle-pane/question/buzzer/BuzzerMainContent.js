import { QuestionType } from '@/backend/models/questions/QuestionType';

import ProgressiveCluesMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/ProgressiveCluesMainContent';
import ImageMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/ImageMainContent';
import BlindtestMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/BlindtestMainContent';
import EmojiMainContent from '@/frontend/components/game/middle-pane/question/buzzer/main-content/EmojiMainContent';

export default function BuzzerMainContent({ baseQuestion, showComplete }) {
  switch (baseQuestion.type) {
    case QuestionType.PROGRESSIVE_CLUES:
      return <ProgressiveCluesMainContent baseQuestion={baseQuestion} showComplete={showComplete} />;
    case QuestionType.IMAGE:
      return <ImageMainContent baseQuestion={baseQuestion} />;
    case QuestionType.BLINDTEST:
      return <BlindtestMainContent baseQuestion={baseQuestion} />;
    case QuestionType.EMOJI:
      return <EmojiMainContent baseQuestion={baseQuestion} />;
    default:
      return <p>Unknown round type</p>;
  }
}
