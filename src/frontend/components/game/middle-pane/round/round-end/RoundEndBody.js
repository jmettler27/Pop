import RoundScoreRepository from '@/backend/repositories/score/RoundScoreRepository';

import { useGameRepositoriesContext } from '@/frontend/contexts';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import LoadingScreen from '@/frontend/components/LoadingScreen';

import RoundScoreboard from '@/frontend/components/scores/RoundScoreboard';
import RoundScoresChart from '@/frontend/components/scores/RoundScoresChart';
import GameScoreboard from '@/frontend/components/scores/GameScoreboard';
import GameScoresChart from '@/frontend/components/scores/GameScoresChart';

import { useParams } from 'next/navigation';

export default function RoundEndBody({ currentRound, lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();

  const { teamRepo } = useGameRepositoriesContext();
  const { teams, loading: teamsLoading, error: teamsError } = teamRepo.useAllTeamsOnce();

  const roundScoreRepo = new RoundScoreRepository(gameId, currentRound.id);
  const { roundScores, loading: roundScoresLoading, error: roundScoresError } = roundScoreRepo.useScoresOnce();

  if (teamsError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(teamsError)}</strong>
      </p>
    );
  }
  if (roundScoresError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(roundScoresError)}</strong>
      </p>
    );
  }
  if (teamsLoading || roundScoresLoading) {
    return <LoadingScreen />;
  }
  if (!teams || !roundScores) {
    return <></>;
  }

  return (
    <div className="flex flex-col h-full w-full items-center justify-around overflow-auto">
      {/* Round statistics */}
      <div className="flex flex-col h-1/2 w-full items-center justify-center">
        <div className="flex flex-col h-[10%] w-full items-center justify-center">
          <h1 className="2xl:text-3xl text-yellow-300">{ROUND_STATS_HEADER_TEXT[lang]}</h1>
        </div>
        <div className="flex flex-row h-[90%] w-full items-center justify-center">
          <div className="flex flex-col h-full w-2/3 items-center justify-center">
            <RoundScoreboard roundScores={roundScores} teams={teams} />
          </div>
          <div className="flex flex-col h-full w-1/2 items-center justify-center">
            {currentRound.type !== 'special' && (
              <RoundScoresChart round={currentRound} roundScores={roundScores} teams={teams} />
            )}
          </div>
        </div>
      </div>
      {/* Game statistics */}
      <div className="flex flex-col h-1/2 w-full items-center justify-center">
        <h1 className="2xl:text-3xl text-yellow-300">{GAME_STATS_HEADER_TEXT[lang]}</h1>
        <div className="flex flex-row h-[90%] w-full items-center justify-center">
          <div className="flex flex-col h-11/12 w-2/3 items-center justify-center">
            <GameScoreboard roundScores={roundScores} teams={teams} />
          </div>
          <div className="flex flex-col h-full w-1/2 items-center justify-center">
            <GameScoresChart currentRoundOrder={currentRound.order} teams={teams} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ROUND_STATS_HEADER_TEXT = {
  en: 'Round statistics',
  'fr-FR': 'Statistiques de la manche',
};

const GAME_STATS_HEADER_TEXT = {
  en: 'Game statistics',
  'fr-FR': 'Statistiques de la partie',
};
