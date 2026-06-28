'use client';

import {
  OddOneOutProposalList,
  OddOneOutQuestionHeader,
} from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutCommon';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';

interface OddOneOutOrganizerPaneProps {
  baseQuestion: OddOneOutQuestion;
  gameQuestion: GameOddOneOutQuestion;
  randomMapping: number[];
}

export default function OddOneOutOrganizerPane({
  baseQuestion,
  gameQuestion,
  randomMapping,
}: OddOneOutOrganizerPaneProps) {
  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <OddOneOutQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className="h-[85%] w-full flex flex-col items-center justify-center">
        <OddOneOutProposalList
          baseQuestion={baseQuestion}
          randomization={randomMapping}
          gameQuestion={gameQuestion}
          isChooser={false}
          authorized={false}
        />
      </div>
    </div>
  );
}
