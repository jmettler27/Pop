'use client';

import { useEffect, useMemo, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Badge,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { clsx } from 'clsx';

import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import { selectProposal } from '@/backend/services/question/odd-one-out/actions';
import { shuffleIndices } from '@/backend/utils/arrays';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { QuestionTypeIcon } from '@/frontend/helpers/question_types';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { GameOddOneOutQuestion, OddOneOutItem, OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { topicToEmoji, type Topic } from '@/models/topic';
import { ParticipantRole } from '@/models/users/participant';

interface SelectedItem {
  idx: number;
  playerId: string;
}

export default function OddOneOutMiddlePane({ baseQuestion }: { baseQuestion: OddOneOutQuestion }) {
  const randomMapping = useMemo(
    () => shuffleIndices((baseQuestion.items ?? []).length),
    [(baseQuestion.items ?? []).length]
  );

  return (
    <div className="flex flex-col h-full items-center">
      <div className="h-[15%] w-full flex flex-col items-center justify-center">
        <OddOneOutQuestionHeader baseQuestion={baseQuestion} />
      </div>
      <div className={clsx('h-[85%] w-full flex flex-col items-center justify-center')}>
        <OddOneOutMainContent baseQuestion={baseQuestion} randomization={randomMapping} />
      </div>
    </div>
  );
}

function OddOneOutQuestionHeader({ baseQuestion }: { baseQuestion: OddOneOutQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-4xl">{baseQuestion.title}</h2>
        {baseQuestion.note && <NoteButton note={baseQuestion.note} />}
      </div>
    </div>
  );
}

function OddOneOutMainContent({
  baseQuestion,
  randomization,
}: {
  baseQuestion: OddOneOutQuestion;
  randomization: number[];
}) {
  const game = useGame();
  if (!game) return null;
  const myTeam = useTeam();

  const gameQuestionRepo = new GameOddOneOutQuestionRepository(game.id as string, game.currentRound as string);
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { chooserRepo, timerRepo } = gameRepositories;

  const {
    gameQuestion,
    loading: gameQuestionLoading,
    error: gameQuestionError,
  } = gameQuestionRepo.useQuestion(game.currentQuestion as string);
  const { isChooser, loading: chooserLoading, error: chooserError } = chooserRepo.useIsChooser(myTeam as string);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (gameQuestionError || chooserError || timerError) {
    return <ErrorScreen inline />;
  }
  if (gameQuestionLoading || chooserLoading || timerLoading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion || !timer) {
    return <></>;
  }

  const gameQuestionData = gameQuestion as unknown as GameOddOneOutQuestion;
  const timerData = timer as unknown as { authorized: boolean };

  return (
    <OddOneOutProposals
      baseQuestion={baseQuestion}
      randomization={randomization}
      selectedItems={gameQuestionData.selectedItems as unknown as SelectedItem[]}
      isChooser={isChooser ?? false}
      authorized={timerData.authorized}
    />
  );
}

interface OddOneOutProposalsProps {
  baseQuestion: OddOneOutQuestion;
  randomization: number[];
  selectedItems: SelectedItem[];
  isChooser: boolean;
  authorized: boolean;
}

function OddOneOutProposals({
  baseQuestion,
  randomization,
  selectedItems,
  isChooser,
  authorized,
}: OddOneOutProposalsProps) {
  const game = useGame();
  const user = useUser();

  const [handleSelectProposal, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!game || !user) return;
    await selectProposal(game.id as string, game.currentRound as string, game.currentQuestion as string, user.id, idx);
  });

  const [expandedIdx, setExpandedIdx] = useState<number | false>(false);

  useEffect(() => {
    if (!game) return;
    if (game.status === GameStatus.QUESTION_END) {
      setExpandedIdx(baseQuestion.answerIdx ?? false);
    } else if (selectedItems.length > 0) {
      setExpandedIdx(selectedItems[selectedItems.length - 1]!.idx);
    }
  }, [selectedItems, game?.status]);

  const proposalIsExpanded = (origIdx: number) => origIdx === expandedIdx;
  const handleAccordionChange = (origIdx: number) => {
    setExpandedIdx(proposalIsExpanded(origIdx) ? false : origIdx);
  };
  const proposalIsOdd = (origIdx: number) => origIdx === baseQuestion.answerIdx;

  const items = baseQuestion.items ?? [];

  return (
    <List className="rounded-lg max-h-[95%] w-1/3 overflow-y-auto mb-3" sx={{ bgcolor: 'background.paper' }}>
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
    </List>
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
  const myRole = useRole();

  const isClicked = selectedItem != null;
  const showExplanation = game?.status === GameStatus.QUESTION_END || isClicked;
  const showComplete = myRole === ParticipantRole.ORGANIZER || showExplanation;

  const isItemInteractive =
    myRole === ParticipantRole.ORGANIZER ||
    (myRole === ParticipantRole.PLAYER && isChooser && authorized && !showExplanation);

  return showExplanation ? (
    <Accordion className="flex-grow" expanded={expanded} onChange={onAccordionChange} disabled={false} disableGutters>
      <AccordionSummary expandIcon={showComplete && <ExpandMoreIcon />}>
        <ListItemIcon>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={isClicked && <SelectedProposalPlayerAvatar playerId={selectedItem!.playerId} />}
          >
            {isOdd ? <CloseIcon fontSize="medium" color="error" /> : <CheckIcon fontSize="medium" color="success" />}
          </Badge>
        </ListItemIcon>
        <Typography sx={{ color: isOdd ? 'red' : 'green', marginRight: '10px' }} variant="h6">
          {item.title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography sx={{ color: 'text.secondary' }} variant="h6">
          {item.explanation}
        </Typography>
      </AccordionDetails>
    </Accordion>
  ) : (
    <ListItemButton
      className="max-w-full"
      divider={!isLast}
      onClick={onProposalClick}
      disabled={isSubmitting || !isItemInteractive}
      sx={{ '&.Mui-disabled': { opacity: 1.0 } }}
    >
      <ListItemText
        sx={{ color: 'text.primary' }}
        primary={item.title}
        primaryTypographyProps={{ className: '2xl:text-xl' }}
      />
    </ListItemButton>
  );
}

function SelectedProposalPlayerAvatar({ playerId }: { playerId: string }) {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo } = gameRepositories;
  const { player, loading, error } = playerRepo.usePlayerOnce(playerId);

  if (error || loading || !player) return null;

  const playerData = player as unknown as { name: string; image: string };
  return <Avatar alt={playerData.name} src={playerData.image} sx={{ width: 25, height: 25 }} />;
}
