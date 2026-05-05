import { useMemo } from 'react';
import Image from 'next/image';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Avatar, Badge, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { clsx } from 'clsx';

import mcqCorrect from '@/assets/images/mcq-correct.png';
import mcqWrong from '@/assets/images/mcq-wrong.png';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { MCQQuestion } from '@/backend/models/questions/MCQ';
import { ParticipantRole } from '@/backend/models/users/Participant';
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

export default function MCQMainContent({ baseQuestion }) {
  const title = baseQuestion.title;
  const note = baseQuestion.note;
  const choices = baseQuestion.choices;

  // Randomize the order of the choices on the client side
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

function MCQAnswerImage({ correct }) {
  console.log('MCQAnswerImage - correct:', correct);
  if (correct === true) {
    return <Image src={mcqCorrect} alt="Correct answer" style={{ width: '70%', height: 'auto' }} />;
  }
  if (correct === false) {
    return <Image src={mcqWrong} alt="Wrong answer" style={{ width: '80%', height: 'auto' }} />;
  }
  return <></>;
}

function MCQMainContentQuestion({ baseQuestion, randomization }) {
  const game = useGame();

  const gameQuestionRepo = new GameMCQQuestionRepository(game.id, game.currentRound);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion);

  if (error) {
    return <ErrorScreen inline />;
  }
  if (loading) {
    return <LoadingScreen inline />;
  }
  if (!gameQuestion) {
    return <></>;
  }

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <MCQAnswerImage correct={gameQuestion.correct} />
      </div>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveMCQChoices baseQuestion={baseQuestion} gameQuestion={gameQuestion} randomization={randomization} />
      )}
      {game.status === GameStatus.QUESTION_END && (
        <EndedMCQChoices baseQuestion={baseQuestion} gameQuestion={gameQuestion} randomization={randomization} />
      )}
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <MCQAnswerImage correct={gameQuestion.correct} />
      </div>
    </div>
  );
}

const choiceIsDisabled = (myRole, isChooser) => !(myRole === ParticipantRole.PLAYER && isChooser);

function ActiveMCQChoices({ baseQuestion, gameQuestion, randomization }) {
  const game = useGame();
  const myTeam = useTeam();
  const myRole = useRole();
  const user = useUser();

  const choices = baseQuestion.choices;

  const isChooser = myTeam === gameQuestion.teamId;

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx) => {
    await selectChoice(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, idx);
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

function EndedMCQChoices({ baseQuestion, gameQuestion, randomization }) {
  const choices = baseQuestion.choices;
  const answerIdx = baseQuestion.answerIdx;
  const { choiceIdx, correct, playerId } = gameQuestion;

  const isCorrectAnswer = (idx) => idx === answerIdx;
  const isIncorrectChoice = (idx) => idx === choiceIdx && idx !== answerIdx;
  const isNeutralChoice = (idx) => idx !== choiceIdx && idx !== answerIdx;

  const getBorderColor = (idx) => {
    if (isCorrectAnswer(idx)) return 'border-green-500';
    if (isIncorrectChoice(idx)) return 'border-red-600';
    if (isNeutralChoice(idx)) return 'border-white border-opacity-35';
  };

  const getTextColor = (idx) => {
    if (isCorrectAnswer(idx)) return 'text-green-500 font-bold';
    if (isIncorrectChoice(idx)) return 'text-red-600 font-bold';
    if (isNeutralChoice(idx)) return 'text-white opacity-35';
  };

  const getListItemIcon = (idx) => {
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

function PlayerAvatar({ playerId }) {
  const { playerRepo } = useGameRepositories();
  const { player, loading, error } = playerRepo.usePlayerOnce(playerId);

  return !error && !loading && player && <Avatar alt={player.name} src={player.image} sx={{ width: 30, height: 30 }} />;
}
