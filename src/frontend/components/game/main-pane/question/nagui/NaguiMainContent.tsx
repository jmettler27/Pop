'use client';

import { useMemo } from 'react';
import Image from 'next/image';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { Avatar, Badge, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { clsx } from 'clsx';

import naguiCorrect from '@/assets/images/nagui-correct.png';
import naguiWrong from '@/assets/images/nagui-wrong.png';
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
import type { GameRounds } from '@/models/games/game';
import { GameStatus } from '@/models/games/game-status';
import {
  DuoNaguiOption,
  GameNaguiQuestion,
  HideNaguiOption,
  NaguiQuestion,
  SquareNaguiOption,
} from '@/models/questions/nagui';
import { ParticipantRole } from '@/models/users/participant';

export default function NaguiMainContent({ baseQuestion }: { baseQuestion: NaguiQuestion }) {
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
        <NaguiMainContentQuestion baseQuestion={baseQuestion} randomization={randomMapping} />
      </div>
    </div>
  );
}

function NaguiAnswerImage({ correct }: { correct: boolean | null | undefined }) {
  if (correct === true) {
    return <Image src={naguiCorrect} alt="Correct answer" style={{ width: '100%', height: 'auto' }} />;
  }
  if (correct === false) {
    return <Image src={naguiWrong} alt="Wrong answer" style={{ width: '80%', height: 'auto' }} />;
  }
  return <></>;
}

function NaguiMainContentQuestion({
  baseQuestion,
  randomization,
}: {
  baseQuestion: NaguiQuestion;
  randomization: number[];
}) {
  const game = useGame();
  if (!game) return null;

  const gameQuestionRepo = new GameNaguiQuestionRepository(game.id as string, game.currentRound as string);
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

  const gameQuestionData = gameQuestion as unknown as GameNaguiQuestion;

  return (
    <div className="flex flex-row h-full w-full items-center justify-center">
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <NaguiAnswerImage correct={gameQuestionData.correct} />
      </div>
      {game.status === GameStatus.QUESTION_ACTIVE && (
        <ActiveNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestionData} randomization={randomization} />
      )}
      {game.status === GameStatus.QUESTION_END && (
        <EndedNaguiChoices baseQuestion={baseQuestion} gameQuestion={gameQuestionData} randomization={randomization} />
      )}
      <div className="flex flex-col h-full w-1/4 items-center justify-center">
        <NaguiAnswerImage correct={gameQuestionData.correct} />
      </div>
    </div>
  );
}

const choiceIsDisabled = (
  choiceIdx: number,
  myRole: string | null,
  isChooser: boolean,
  option: string | null,
  duoIdx: number | undefined,
  answerIdx: number | undefined
): boolean => {
  if (!(myRole === ParticipantRole.PLAYER && isChooser)) return true;
  if (option === DuoNaguiOption.TYPE) return !(choiceIdx === duoIdx || choiceIdx === answerIdx);
  if (option === SquareNaguiOption.TYPE) return false;
  return true;
};

function ActiveNaguiChoices({
  baseQuestion,
  gameQuestion,
  randomization,
}: {
  baseQuestion: NaguiQuestion;
  gameQuestion: GameNaguiQuestion;
  randomization: number[];
}) {
  const game = useGame();
  if (!game) return null;
  const myTeam = useTeam();
  const myRole = useRole();
  const user = useUser();

  const choices = baseQuestion.choices ?? [];
  const answerIdx = baseQuestion.answerIdx;
  const duoIdx = baseQuestion.duoIdx;

  const isChooser = myTeam === gameQuestion.teamId;

  const [handleSelectChoice, isSubmitting] = useAsyncAction(async (idx: number) => {
    if (!user) return;
    await selectChoice(
      game.id as string,
      game.currentRound as string,
      game.currentQuestion as string,
      user.id,
      myTeam as string,
      idx
    );
  });

  if (gameQuestion.option === null || gameQuestion.option === HideNaguiOption.TYPE) {
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
                primaryTypographyProps={{
                  className: '2xl:text-2xl',
                }}
              />
            </ListItemButton>
          )
      )}
    </List>
  );
}

function EndedNaguiChoices({
  baseQuestion,
  gameQuestion,
  randomization,
}: {
  baseQuestion: NaguiQuestion;
  gameQuestion: GameNaguiQuestion;
  randomization: number[];
}) {
  const choices = baseQuestion.choices ?? [];
  const answerIdx = baseQuestion.answerIdx;

  const choiceIdx = gameQuestion.choiceIdx;
  const correct = gameQuestion.correct;
  const playerId = gameQuestion.playerId;
  const option = gameQuestion.option;

  const isCorrectAnswer = (idx: number) =>
    (option === HideNaguiOption.TYPE && correct && idx === answerIdx) || idx === answerIdx;
  const isIncorrectChoice = (idx: number) =>
    (option === DuoNaguiOption.TYPE || option === SquareNaguiOption.TYPE) && idx === choiceIdx && idx !== answerIdx;
  const isNeutralChoice = (idx: number) =>
    (option === HideNaguiOption.TYPE && correct && idx !== answerIdx) || (idx !== choiceIdx && idx !== answerIdx);

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
  const { player, loading, error } = playerRepo.usePlayerOnce(playerId ?? '');

  if (error || loading || !player) return null;

  const playerData = player as unknown as { name: string; image: string };
  return <Avatar alt={playerData.name} src={playerData.image} sx={{ width: 30, height: 30 }} />;
}
