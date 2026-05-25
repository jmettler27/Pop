'use client';

import { useIntl } from 'react-intl';

import { RoundCompletionRatePolicy } from '@/frontend/components/game/main-pane/round/RoundCompletionRatePolicy';
import { RoundDescription } from '@/frontend/components/game/main-pane/round/RoundDescription';
import { RoundRankingPolicy } from '@/frontend/components/game/main-pane/round/RoundRankingPolicy';
import { RoundRules } from '@/frontend/components/game/main-pane/round/RoundRules';
import { numberToKeycapEmoji } from '@/frontend/helpers/emojis';
import useGame from '@/frontend/hooks/useGame';
import defineMessages from '@/frontend/i18n/defineMessages';
import { AnyRound } from '@/models/rounds/RoundFactory';
import { ScorePolicyType } from '@/models/score-policy';

const messages = defineMessages('frontend.game.round.RoundStartBody', {
  rules: '📜 Rules',
});

export default function RoundStartBody({ round }: { round: AnyRound }) {
  const { formatMessage } = useIntl();

  return (
    <div className="flex flex-row justify-around w-full h-full p-10 [&>*]:">
      {/* General principle + Number of questions */}
      <div className="border-dashed border-4 p-2 w-[30%] h-full overflow-auto">
        <RoundGeneralInfo round={round} />
      </div>

      {/* Additional Remarks */}
      <div className="border-dashed border-4 p-2 w-[30%] h-full overflow-auto">
        <div className="flex flex-col items-center justify-start space-y-4 p-2">
          <h1 className="2xl:text-3xl font-bold">{formatMessage(messages.rules)}</h1>
          <RoundRules round={round} />
        </div>
      </div>

      {/* Scaling */}
      <div className="border-dashed border-4 p-2 w-[30%] h-full overflow-auto">
        <RoundScorePolicy round={round} />
      </div>
    </div>
  );
}

/* ================================================================ Round Info ================================================================ */
function RoundGeneralInfo({ round }: { round: AnyRound }) {
  const numQuestions = round.questions.length;
  return (
    <div className="flex flex-col items-center justify-start p-2">
      <h1 className="2xl:text-3xl mb-4 font-bold">
        {numberToKeycapEmoji(numQuestions)} question{numQuestions > 1 && 's'}
      </h1>
      <RoundDescription round={round} />
    </div>
  );
}

function RoundScorePolicy({ round }: { round: AnyRound }) {
  const game = useGame();
  if (!game) return null;

  return (
    <>
      {(game as unknown as { roundScorePolicy: string }).roundScorePolicy === ScorePolicyType.RANKING && (
        <RoundRankingPolicy round={round} />
      )}
      {(game as unknown as { roundScorePolicy: string }).roundScorePolicy === ScorePolicyType.COMPLETION_RATE && (
        <RoundCompletionRatePolicy round={round} />
      )}
    </>
  );
}
