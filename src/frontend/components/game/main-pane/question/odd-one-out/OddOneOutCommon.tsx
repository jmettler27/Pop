'use client';

import { useMemo, useState } from 'react';

import { clsx } from 'clsx';
import { Check, X } from 'lucide-react';

import { selectProposal } from '@/backend/services/question/odd-one-out/actions';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/frontend/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/frontend/components/ui/avatar';
import { QuestionTypeIcon } from '@/frontend/helpers/question-types';
import { usePlayerOnce } from '@/frontend/hooks/firestore/user/usePlayerHooks';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameId from '@/frontend/hooks/useGameId';
import useRole from '@/frontend/hooks/useRole';
import useUser from '@/frontend/hooks/useUser';
import { GameStatus } from '@/models/games/game-status';
import { GameOddOneOutQuestion, OddOneOutItem, OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

export interface SelectedItem {
  idx: number;
  playerId: string;
}

export function OddOneOutQuestionHeader({ baseQuestion }: { baseQuestion: OddOneOutQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} className="size-7 md:size-[50px]" />
        <h1 className="text-xs md:text-xl 2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="text-xs md:text-lg 2xl:text-4xl">{baseQuestion.title}</h2>
        {baseQuestion.note && <NoteButton note={baseQuestion.note} />}
      </div>
    </div>
  );
}

interface OddOneOutProposalListProps {
  baseQuestion: OddOneOutQuestion;
  randomization: number[];
  gameQuestion: GameOddOneOutQuestion;
  isChooser: boolean;
  authorized: boolean;
  listClassName?: string;
}

export function OddOneOutProposalList({
  baseQuestion,
  randomization,
  gameQuestion,
  isChooser,
  authorized,
  listClassName,
}: OddOneOutProposalListProps) {
  const game = useGame();
  const user = useUser();
  const selectedItems = useMemo(
    () => (gameQuestion.selectedItems as unknown as SelectedItem[]) ?? [],
    [gameQuestion.selectedItems]
  );

  const [handleSelectProposal, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!game || !user) return;
    await selectProposal(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id as string,
      idx
    );
  });

  const [expandedIdx, setExpandedIdx] = useState<number | false>(false);
  const [prevSelectedItems, setPrevSelectedItems] = useState(selectedItems);
  const [prevStatus, setPrevStatus] = useState(game?.status);

  if (game && (selectedItems !== prevSelectedItems || game.status !== prevStatus)) {
    setPrevSelectedItems(selectedItems);
    setPrevStatus(game.status);
    if (game.status === GameStatus.QUESTION_END) {
      setExpandedIdx(baseQuestion.answerIdx ?? false);
    } else if (selectedItems.length > 0) {
      setExpandedIdx(selectedItems[selectedItems.length - 1]!.idx);
    }
  }

  const proposalIsExpanded = (origIdx: number) => origIdx === expandedIdx;
  const handleAccordionChange = (origIdx: number) => {
    setExpandedIdx(proposalIsExpanded(origIdx) ? false : origIdx);
  };
  const proposalIsOdd = (origIdx: number) => origIdx === baseQuestion.answerIdx;

  const items = baseQuestion.items ?? [];

  return (
    <div className={clsx(listClassName ?? 'rounded-lg max-h-[95%] w-1/3 overflow-y-auto mb-3', 'bg-background')}>
      {randomization.map((origIdx, idx) => (
        <ProposalItem
          key={idx}
          item={items[origIdx]!}
          onProposalClick={() => handleSelectProposal(origIdx)}
          onAccordionChange={() => handleAccordionChange(origIdx)}
          selectedItem={selectedItems.find((selected) => selected.idx === origIdx)}
          expanded={proposalIsExpanded(origIdx)}
          isOdd={proposalIsOdd(origIdx)}
          isLast={idx === items.length - 1}
          isChooser={isChooser}
          authorized={authorized}
          isSubmitting={isSubmitting}
        />
      ))}
    </div>
  );
}

interface ProposalItemProps {
  item: OddOneOutItem;
  onProposalClick: () => void;
  onAccordionChange: () => void;
  selectedItem: SelectedItem | undefined;
  expanded: boolean;
  isOdd: boolean;
  isLast: boolean;
  isChooser: boolean;
  authorized: boolean;
  isSubmitting: boolean;
}

function ProposalItem({
  item,
  onProposalClick,
  onAccordionChange,
  selectedItem,
  expanded,
  isOdd,
  isLast,
  isChooser,
  authorized,
  isSubmitting,
}: ProposalItemProps) {
  const game = useGame();
  const role = useRole();

  const isClicked = selectedItem != null;
  const showExplanation = game?.status === GameStatus.QUESTION_END || isClicked;
  const showComplete = role === ParticipantRole.ORGANIZER || showExplanation;

  const isItemInteractive =
    role === ParticipantRole.ORGANIZER ||
    (role === ParticipantRole.PLAYER && isChooser && authorized && !showExplanation);

  return showExplanation ? (
    <Accordion value={expanded ? ['item'] : []} onValueChange={() => onAccordionChange()} className="grow">
      <AccordionItem value="item">
        <AccordionTrigger className={clsx('px-3', !showComplete && '[&_[data-slot=accordion-trigger-icon]]:hidden')}>
          <span className="flex items-center justify-center min-w-14">
            <span className="relative inline-flex">
              {isOdd ? <X className="size-6 text-destructive" /> : <Check className="size-6 text-green-500" />}
              {isClicked && (
                <span className="absolute -bottom-1 -right-1">
                  <SelectedProposalPlayerAvatar playerId={selectedItem!.playerId} />
                </span>
              )}
            </span>
          </span>
          <p className={`mr-2.5 text-[0.875rem] md:text-[1.25rem] ${isOdd ? 'text-red-600' : 'text-green-600'}`}>
            {item.title}
          </p>
        </AccordionTrigger>
        <AccordionContent className="px-3">
          <p className="text-muted-foreground text-[0.875rem] md:text-[1.25rem]">{item.explanation}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ) : (
    <button
      type="button"
      onClick={onProposalClick}
      disabled={isSubmitting || !isItemInteractive}
      className={clsx(
        'max-w-full w-full text-left px-4 py-2 hover:bg-muted disabled:opacity-100 disabled:pointer-events-none',
        !isLast && 'border-b border-border'
      )}
    >
      <span className="text-foreground text-[0.875rem] md:text-base xl:text-[1.25rem]">{item.title}</span>
    </button>
  );
}

function SelectedProposalPlayerAvatar({ playerId }: { playerId: string }) {
  const gameId = useGameId();
  const { player, loading, error } = usePlayerOnce(gameId, playerId);

  if (error || loading || !player) return null;

  const playerData = player as unknown as { name: string; image: string };
  return (
    <Avatar className="size-[25px]">
      <AvatarImage alt={playerData.name} src={playerData.image} />
      <AvatarFallback className="text-xs">{playerData.name?.[0]?.toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}
