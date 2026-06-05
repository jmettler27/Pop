import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import MCQMainContent from '@/frontend/components/game/main-pane/question/mcq/MCQMainContent';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import { Emoji } from '@/frontend/components/ui/Emoji';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useGame from '@/frontend/hooks/useGame';
import { GameStatus } from '@/models/games/game-status';
import { MCQQuestion } from '@/models/questions/mcq';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';

export default function MCQMiddlePane({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  const game = useGame();

  return (
    <div className="flex flex-col h-full items-center">
      <div className="flex-shrink-0 flex flex-col items-center justify-center py-2">
        <MCQHeader baseQuestion={baseQuestion} />
      </div>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        <MCQMainContent baseQuestion={baseQuestion} />
      </div>
      {game!.status === GameStatus.QUESTION_END && (
        <div className="flex-shrink-0 w-full flex items-center justify-center py-2 px-4">
          <MCQFooter baseQuestion={baseQuestion} />
        </div>
      )}
    </div>
  );
}

function MCQHeader({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  return (
    <div className="flex flex-row items-center justify-center space-x-1">
      <QuestionTypeIcon questionType={baseQuestion.type} fontSize={40} />
      <h1 className="2xl:text-5xl">
        <Emoji emoji={topicToEmoji(baseQuestion.topic as Topic)} />{' '}
        <strong>
          {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
        </strong>
      </h1>
    </div>
  );
}

function MCQFooter({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  const { explanation } = baseQuestion;
  if (!explanation) return null;
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm 2xl:text-base w-full max-w-2xl">
      <InfoOutlinedIcon sx={{ fontSize: 16, color: 'rgb(147 197 253)', flexShrink: 0, mt: '2px' }} />
      <span className="leading-snug">{explanation}</span>
    </div>
  );
}
