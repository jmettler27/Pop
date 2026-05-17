import { useMemo } from 'react';
import Image from 'next/image';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Avatar, Badge, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { clsx } from 'clsx';

import mcqCorrect from '@/assets/images/mcq-correct.png';
import mcqWrong from '@/assets/images/mcq-wrong.png';
import GameMCQQuestionRepository from '@/backend/repositories/question/GameMCQQuestionRepository';
import { selectChoice } from '@/backend/services/question/mcq/actions';
import { shuffleIndices } from '@/backend/utils/arrays';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import NoteButton from '@/frontend/components/game/NoteButton';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGame from '@/frontend/hooks/useGame';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import { GameMCQQuestion, MCQQuestion } from '@/models/questions/mcq';
import { ParticipantRole } from '@/models/users/participant';

export default function MCQMainContent({ baseQuestion }: { baseQuestion: MCQQuestion }) {
  const title = baseQuestion.title;
  const note = baseQuestion.note;
  const choices = baseQuestion.choices ?? [];

  const randomMapping = useMemo(() => shuffleIndices(choices.length), [choices.length]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="h-[25%] w-full flex flex-row items-center justify-center space-x-1">
        <h2 className="2xl:text-4xl font-bold">{title}</h2>
        {note && <NoteButton note={note} />}
      </div>
      <div className="h-[75%] w-full flex items-center justify-center">
        <MCQMainContentQuestion baseQuestion={baseQuestion} randomization={randomMapping} />
      </div>
    </div>
  );
}

function MCQAnswerImage({ correct }: { correct: boolean | null | undefined }) {
  if (correct === true) {
    return <Image src={mcqCorrect} alt="Correct answer" style={{ width: '70%', height: 'auto' }} />;
  }
  if (correct === false) {
    return <Image src={mcqWrong} alt="Wrong answer" style={{ width: '80%', height: 'auto' }} />;
  }
  return <></>;
}

function MCQMainContentQuestion({
  baseQuestion,
  randomization,
}: {
  baseQuestion: MCQQuestion;
  randomization: number[];
}) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameMCQQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  const gameQ = gameQuestion as unknown as GameMCQQuestion;

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <MCQAnswerImage correct={gameQ.correct} />
      </div>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveMCQChoices baseQuestion={baseQuestion} gameQuestion={gameQ} randomization={randomization} />
      )}
      {game.status === GameStatus.QUESTION_END && (
        <EndedMCQChoices baseQuestion={baseQuestion} gameQuestion={gameQ} randomization={randomization} />
      )}
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <MCQAnswerImage correct={gameQ.correct} />
      </div>
    </div>
  );
}

const choiceIsDisabled = (myRole: ParticipantRole | null, isChooser: boolean) =>
  !(myRole === ParticipantRole.PLAYER && isChooser);

interface MCQChoicesProps {
  baseQuestion: MCQQuestion;
  gameQuestion: GameMCQQuestion;
  randomization: number[];
}

function ActiveMCQChoices({ baseQuestion, gameQuestion, randomization }: MCQChoicesProps) {
  const game = useGame();
  const myTeam = useTeam();
  const myRole = useRole();
  const user = useUser();

  const choices = baseQuestion.choices ?? [];
  const isChooser = myTeam === gameQuestion.teamId;

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!game || !user) return;
    await selectChoice(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id,
      myTeam as string,
      idx
    );
  });

  return (
    <List className="rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3">
      {randomization.map((origIdx, idx) => (
        <ListItemButton
          key={idx}
          divider={idx !== choices.length - 1}
          disabled={isSubmitting || choiceIsDisabled(myRole, isChooser)}
          sx={{
            '&.Mui-disabled': { opacity: 1 },
          }}
          className="border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400"
          onClick={() => handleSelectChoice(origIdx)}
        >
          <ListItemText
            primary={`${MCQQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
            primaryTypographyProps={{
              className: '2xl:text-2xl',
            }}
          />
        </ListItemButton>
      ))}
    </List>
  );
}

function EndedMCQChoices({ baseQuestion, gameQuestion, randomization }: MCQChoicesProps) {
  const choices = baseQuestion.choices ?? [];
  const answerIdx = baseQuestion.answerIdx;
  const { choiceIdx, correct, playerId } = gameQuestion;

  const isCorrectAnswer = (idx: number) => idx === answerIdx;
  const isIncorrectChoice = (idx: number) => idx === choiceIdx && idx !== answerIdx;
  const isNeutralChoice = (idx: number) => idx !== choiceIdx && idx !== answerIdx;

  const getBorderColor = (idx: number) => {
    if (isCorrectAnswer(idx)) return 'border-green-500';
    if (isIncorrectChoice(idx)) return 'border-red-600';
    if (isNeutralChoice(idx)) return 'border-white border-opacity-35';
  };

  const getTextColor = (idx: number) => {
    if (isCorrectAnswer(idx)) return 'text-green-500 font-bold';
    if (isIncorrectChoice(idx)) return 'text-red-600 font-bold';
    if (isNeutralChoice(idx)) return 'text-white opacity-35';
  };

  const getListItemIcon = (idx: number) => {
    if (idx === answerIdx && correct === true) {
      return (
        <ListItemIcon>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={<PlayerAvatar playerId={playerId} />}
          >
            <CheckIcon fontSize="medium" color="success" />
          </Badge>
        </ListItemIcon>
      );
    }

    if (idx === choiceIdx && correct === false) {
      return (
        <ListItemIcon>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={<PlayerAvatar playerId={playerId} />}
          >
            <CloseIcon fontSize="medium" color="error" />
          </Badge>
        </ListItemIcon>
      );
    }
  };

  return (
    <List className="rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3">
      {randomization.map((origIdx, idx) => (
        <ListItemButton
          key={idx}
          divider={idx !== choices.length - 1}
          disabled={true}
          sx={{ '&.Mui-disabled': { opacity: 1 } }}
          className={clsx('border-4 border-solid rounded-lg', getBorderColor(origIdx))}
        >
          <ListItemText
            primary={`${MCQQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
            primaryTypographyProps={{ className: clsx('2xl:text-2xl', getTextColor(origIdx)) }}
          />
          {getListItemIcon(origIdx)}
        </ListItemButton>
      ))}
    </List>
  );
}

function PlayerAvatar({ playerId }: { playerId: string | null }) {
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { playerRepo } = gameRepositories;
  const { player, loading, error } = playerRepo.usePlayerOnce(playerId as string);

  return (
    !error &&
    !loading &&
    player && (
      <Avatar
        alt={(player as unknown as { name: string }).name}
        src={(player as unknown as { image: string }).image}
        sx={{ width: 30, height: 30 }}
      />
    )
  );
}
