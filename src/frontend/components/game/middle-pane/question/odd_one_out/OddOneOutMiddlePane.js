import { selectProposal } from '@/backend/services/question/odd-one-out/actions';

import RoundOddOneOutQuestionRepository from '@/backend/repositories/question/game/GameOddOneOutQuestionRepository';

import { UserRole } from '@/backend/models/users/User';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { topicToEmoji } from '@/backend/models/Topic';
import { questionTypeToTitle } from '@/backend/models/questions/QuestionType';

import { shuffleIndices } from '@/backend/utils/arrays';
import { QuestionTypeIcon } from '@/backend/utils/question_types';

import {
  useUserContext,
  useGameContext,
  useGameRepositoriesContext,
  useRoleContext,
  useTeamContext,
} from '@/frontend/contexts';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import { CurrentRoundQuestionOrder } from '@/frontend/components/game/middle-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { useState, useEffect, useMemo } from 'react';

import {
  Badge,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { clsx } from 'clsx';

export default function OddOneOutMiddlePane({ baseQuestion }) {
  // Randomize the order of the items on the client side
  const randomMapping = useMemo(() => shuffleIndices(baseQuestion.items.length), [baseQuestion.items.length]);

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

function OddOneOutQuestionHeader({ baseQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={50} />
        <h1 className="2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic)}{' '}
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

function OddOneOutMainContent({ baseQuestion, randomization }) {
  const game = useGameContext();
  const myTeam = useTeamContext();

  const oddOneOutRepo = new RoundOddOneOutQuestionRepository(game.id, game.currentRound);
  const { chooserRepo, timerRepo } = useGameRepositoriesContext();

  const { gameQuestion, gameQuestionLoading, gameQuestionError } = oddOneOutRepo.useQuestion(game.currentQuestion);
  const { isChooser, chooserLoading, chooserError } = chooserRepo.useIsChooser(myTeam);
  const { timer, timerLoading, timerError } = timerRepo.useTimer();

  if (gameQuestionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameQuestionError)}</strong>
      </p>
    );
  }
  if (chooserError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(chooserError)}</strong>
      </p>
    );
  }
  if (timerError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(timerError)}</strong>
      </p>
    );
  }
  if (gameQuestionLoading || chooserLoading || timerLoading) {
    return <LoadingScreen />;
  }
  if (!gameQuestion || !isChooser || !timer) {
    return <></>;
  }

  return (
    <OddOneOutProposals
      baseQuestion={baseQuestion}
      randomization={randomization}
      selectedItems={gameQuestion.selectedItems}
      isChooser={isChooser}
      authorized={timer.authorized}
    />
  );
}

function OddOneOutProposals({ baseQuestion, randomization, selectedItems, isChooser, authorized }) {
  const game = useGameContext();
  const user = useUserContext();

  const [handleSelectProposal, isSubmitting] = useAsyncAction(async (idx) => {
    await selectProposal(game.id, game.currentRound, game.currentQuestion, user.id, idx);
  });

  const [expandedIdx, setExpandedIdx] = useState(false);

  // Expand the question's accordion whenever the current question changes or the game status changes (question start -> question_end)
  useEffect(() => {
    if (game.status === GameStatus.QUESTION_END) {
      setExpandedIdx(baseQuestion.answerIdx);
    } else if (selectedItems.length > 0) {
      setExpandedIdx(selectedItems[selectedItems.length - 1].idx);
    }
  }, [selectedItems, game.status]);

  const proposalIsExpanded = (origIdx) => origIdx === expandedIdx;

  const handleAccordionChange = (origIdx) => {
    setExpandedIdx(proposalIsExpanded(origIdx) ? false : origIdx);
  };

  const proposalIsOdd = (origIdx) => origIdx === baseQuestion.answerIdx;

  return (
    <List className="rounded-lg max-h-[95%] w-1/3 overflow-y-auto mb-3" sx={{ bgcolor: 'background.paper' }}>
      {randomization.map((origIdx, idx) => (
        <ProposalItem
          key={idx}
          item={baseQuestion.items[origIdx]}
          onProposalClick={() => handleSelectProposal(origIdx)}
          onAccordionChange={() => handleAccordionChange(origIdx)}
          selectedItem={selectedItems.find((selected) => selected.idx === origIdx)}
          expanded={proposalIsExpanded(origIdx)}
          isOdd={proposalIsOdd(origIdx)}
          isLast={idx === baseQuestion.items.length - 1}
          isChooser={isChooser}
          authorized={authorized}
          isSubmitting={isSubmitting}
        />
      ))}
    </List>
  );
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
}) {
  const game = useGameContext();
  const myRole = useRoleContext();

  const isClicked = selectedItem != null;
  const showExplanation = game.status === GameStatus.QUESTION_END || isClicked;
  const showComplete = myRole === UserRole.ORGANIZER || showExplanation;

  const isItemInteractive =
    myRole === UserRole.ORGANIZER || (myRole === UserRole.PLAYER && isChooser && authorized && !showExplanation);

  return showExplanation ? (
    <Accordion className="flex-grow" expanded={expanded} onChange={onAccordionChange} disabled={false} disableGutters>
      <AccordionSummary expandIcon={showComplete && <ExpandMoreIcon />}>
        <ListItemIcon>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={isClicked && <SelectedProposalPlayerAvatar playerId={selectedItem.playerId} />}
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
      sx={{
        '&.Mui-disabled': {
          opacity: 1.0,
        },
      }}
    >
      <ListItemText
        sx={{ color: 'text.primary' }}
        primary={item.title}
        primaryTypographyProps={{
          className: '2xl:text-xl',
        }}
      />
    </ListItemButton>
  );
}

function SelectedProposalPlayerAvatar({ playerId }) {
  const { playerRepo } = useGameRepositoriesContext();
  const { player, playerLoading, playerError } = playerRepo.usePlayerOnce(playerId);
  return (
    !playerError &&
    !playerLoading &&
    player && <Avatar alt={player.name} src={player.image} sx={{ width: 25, height: 25 }} />
  );
}

import Image from 'next/image';

function OddOneOutAnswerImage({ correct }) {
  if (correct === true) {
    return (
      <Image
        src={IMAGES.ODD_ONE_OUT.CORRECT}
        alt="Correct answer"
        width={0}
        height={0}
        style={{ width: '100%', height: 'auto' }}
      />
    );
  }
  if (correct === false) {
    return (
      <Image
        src={IMAGES.ODD_ONE_OUT.WRONG}
        alt="Wrong answer"
        width={0}
        height={0}
        style={{ width: '80%', height: 'auto' }}
      />
    );
  }
  return <></>;
}
