'use client';

import { useMemo } from 'react';

import GameOddOneOutQuestionRepository from '@/backend/repositories/question/GameOddOneOutQuestionRepository';
import { shuffleIndices } from '@/backend/utils/arrays';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import OddOneOutOrganizerPane from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutOrganizerPane';
import OddOneOutPlayerPane from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutPlayerPane';
import OddOneOutSpectatorPane from '@/frontend/components/game/main-pane/question/odd-one-out/OddOneOutSpectatorPane';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';
import { GameOddOneOutQuestion, OddOneOutQuestion } from '@/models/questions/odd-one-out';
import { ParticipantRole } from '@/models/users/participant';

export default function OddOneOutMiddlePane({ baseQuestion }: { baseQuestion: OddOneOutQuestion }) {
  const game = useGame();
  const myRole = useRole();
  const randomMapping = useMemo(() => shuffleIndices((baseQuestion.items ?? []).length), [baseQuestion.items]);

  if (!game) return null;

  const gameQuestionRepo = new GameOddOneOutQuestionRepository(game.id as string, game.currentRound as string);
  const { gameQuestion, loading, error } = gameQuestionRepo.useQuestion(game.currentQuestion as string);

  if (error) return <ErrorScreen inline />;
  if (loading) return <LoadingScreen inline />;
  if (!gameQuestion) return <></>;

  const gameQuestionData = gameQuestion as unknown as GameOddOneOutQuestion;

  switch (myRole) {
    case ParticipantRole.ORGANIZER:
      return (
        <OddOneOutOrganizerPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestionData}
          randomMapping={randomMapping}
        />
      );
    case ParticipantRole.PLAYER:
      return (
        <OddOneOutPlayerPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestionData}
          randomMapping={randomMapping}
        />
      );
    case ParticipantRole.SPECTATOR:
      return (
        <OddOneOutSpectatorPane
          baseQuestion={baseQuestion}
          gameQuestion={gameQuestionData}
          randomMapping={randomMapping}
        />
      );
    default:
      return <></>;
  }
}
