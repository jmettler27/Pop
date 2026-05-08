import { useMemo } from 'react';
import Image from 'next/image';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Avatar, Badge, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { clsx } from 'clsx';

import naguiCorrect from '@/assets/images/nagui-correct.png';
import naguiWrong from '@/assets/images/nagui-wrong.png';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { DuoNaguiOption, HideNaguiOption, NaguiQuestion, SquareNaguiOption } from '@/backend/models/questions/Nagui';
import { ParticipantRole } from '@/backend/models/users/Participant';
import GameNaguiQuestionRepository from '@/backend/repositories/question/GameNaguiQuestionRepository';
import { selectChoice } from '@/backend/services/question/nagui/actions';
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

export default function NaguiMainContent({ baseQuestion }) {
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
        <NaguiMainContentQuestion baseQuestion={baseQuestion} randomization={randomMapping} />
      </div>
    </div>
  );
}

function NaguiAnswerImage({ correct }) {
  console.log('NaguiAnswerImage', { correct });
  if (correct === true) {
    return <Image src={naguiCorrect} alt="Correct answer" style={{ width: '100%', height: 'auto' }} />;
  }
  if (correct === false) {
    return <Image src={naguiWrong} alt="Wrong answer" style={{ width: '80%', height: 'auto' }} />;
  }
  return <></>;
}

function NaguiMainContentQuestion({ baseQuestion, randomization }) {
  const game = useGame();

  const gameQuestionRepo = new GameNaguiQuestionRepository(game.id, game.currentRound);
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
  console.log('NaguiMainContentQuestion', { gameQuestion });

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <NaguiAnswerImage correct={gameQuestion.correct} />
      </div>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestion} randomization={randomization} />
      )}
      {game.status === GameStatus.QUESTION_END && (
        <EndedNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestion} randomization={randomization} />
      )}
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <NaguiAnswerImage correct={gameQuestion.correct} />
      </div>
    </div>
  );
}

const choiceIsDisabled = (choiceIdx, myRole, isChooser, option, duoIdx, answerIdx) => {
  if (!(myRole === ParticipantRole.PLAYER && isChooser)) return true;
  if (option === DuoNaguiOption.TYPE) return !(choiceIdx === duoIdx || choiceIdx === answerIdx);
  if (option === SquareNaguiOption.TYPE) return false;
  return true;
};

function ActiveNaguiChoices({ baseQuestion, gameQuestion, randomization }) {
  const game = useGame();
  const myTeam = useTeam();
  const myRole = useRole();
  const user = useUser();

  const choices = baseQuestion.choices;
  const answerIdx = baseQuestion.answerIdx;
  const duoIdx = baseQuestion.duoIdx;

  const isChooser = myTeam === gameQuestion.teamId;

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx) => {
    await selectChoice(game.id, game.currentRound, game.currentQuestion, user.id, myTeam, idx);
  });

  if (gameQuestion.option === null || gameQuestion.option === HideNaguiOption.TYPE) {
    // return <Image src={nagui_correct.src} height={'70%'} />
    return (
      <span className="2xl:text-6xl">
        {HideNaguiOption.TYPE_TO_EMOJI} {SquareNaguiOption.TYPE_TO_EMOJI} {DuoNaguiOption.TYPE_TO_EMOJI} ?
      </span>
    );
  }

  return (
    <List className="rounded-lg max-h-full w-1/2 overflow-y-auto mb-3 space-y-3">
      {randomization.map(
        (origIdx, idx) =>
          // If the question is a duo question, only show the duoIdx and answerIdx
          (gameQuestion.option !== DuoNaguiOption.TYPE || origIdx === answerIdx || origIdx === duoIdx) && (
            <ListItemButton
              key={idx}
              divider={idx !== choices.length - 1}
              disabled={
                isSubmitting || choiceIsDisabled(origIdx, myRole, isChooser, gameQuestion.option, duoIdx, answerIdx)
              }
              sx={{
                '&.Mui-disabled': { opacity: 1 },
              }}
              className="border-4 border-solid rounded-lg border-blue-500 hover:text-blue-400"
              onClick={() => handleSelectChoice(origIdx)}
            >
              <ListItemText
                primary={`${NaguiQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
                slotProps={{
                  primary: {
                    className: '2xl:text-2xl',
                  },
                }}
              />
            </ListItemButton>
          )
      )}
    </List>
  );
}

function EndedNaguiChoices({ baseQuestion, gameQuestion, randomization }) {
  const choices = baseQuestion.choices;
  const answerIdx = baseQuestion.answerIdx;

  const choiceIdx = gameQuestion.choiceIdx;
  const correct = gameQuestion.correct;
  const playerId = gameQuestion.playerId;
  const option = gameQuestion.option;

  const isCorrectAnswer = (idx) =>
    (option === HideNaguiOption.TYPE && correct && idx === answerIdx) || idx === answerIdx;
  const isIncorrectChoice = (idx) =>
    (option === DuoNaguiOption.TYPE || option === SquareNaguiOption.TYPE) && idx === choiceIdx && idx !== answerIdx;
  const isNeutralChoice = (idx) =>
    (option === HideNaguiOption.TYPE && correct && idx !== answerIdx) || (idx !== choiceIdx && idx !== answerIdx);

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
    if (correct && idx === answerIdx) {
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

    if (option !== HideNaguiOption.TYPE && correct === false && idx === choiceIdx) {
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
            primary={`${NaguiQuestion.CHOICES[idx]}. ${choices[origIdx]}`}
            slotProps={{
              primary: { className: clsx('2xl:text-2xl', getTextColor(origIdx)) },
            }}
          />
          {getListItemIcon(origIdx)}
        </ListItemButton>
      ))}
    </List>
  );
}

function PlayerAvatar({ playerId }) {
  const { playerRepo } = useGameRepositories();
  const { player, playerLoading, playerError } = playerRepo.usePlayerOnce(playerId);

  return (
    !playerError &&
    !playerLoading &&
    player && <Avatar alt={player.name} src={player.image} sx={{ width: 30, height: 30 }} />
  );
}
