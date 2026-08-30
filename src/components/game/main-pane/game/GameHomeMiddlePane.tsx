import type { ReactNode } from 'react';

import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { updateRound } from '@/api';
import ErrorScreen from '@/components/ErrorScreen';
import LoadingScreen from '@/components/LoadingScreen';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type Locale } from '@/helpers/locales';
import { RoundTypeIcon } from '@/helpers/question-types';
import { formatDuration, timestampElapsedSeconds, timestampToShortTime } from '@/helpers/time';
import { useAllRounds } from '@/hooks/firestore/round/useRoundHooks';
import { useIsChooser } from '@/hooks/firestore/user/useChooserHooks';
import useAsyncAction from '@/hooks/useAsyncAction';
import useGameId from '@/hooks/useGameId';
import useIsMobile from '@/hooks/useIsMobile';
import useRole from '@/hooks/useRole';
import useTeamId from '@/hooks/useTeamId';
import defineMessages from '@/i18n/defineMessages';
import { type AnyRound } from '@/models/rounds/RoundFactory';
import { ParticipantRole } from '@/models/users/participant';

const messages = defineMessages('frontend.game.middle.GameHomeMiddlePane', {
  title: 'Rounds',
  roundStarted: 'Started at {time} ({elapsed} ago)',
  roundEnded: 'Round ended at {time} ({duration})',
  sectionAvailable: 'Available',
  sectionCompleted: 'Completed',
});

export default function GameHomeMiddlePane() {
  const intl = useIntl();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="py-5 md:py-6 text-center shrink-0">
        <h1 className="text-2xl md:text-4xl 2xl:text-5xl font-bold text-slate-100">
          {intl.formatMessage(messages.title)}
        </h1>
      </div>
      <GameHomeRounds />
    </div>
  );
}

function GameHomeRounds() {
  const gameId = useGameId();

  const role = useRole();
  const teamId = useTeamId();
  const isMobile = useIsMobile();
  const intl = useIntl();

  const [handleSelect, isHandling] = useAsyncAction(async (roundId: string) => {
    await updateRound(gameId as string, roundId, { action: 'select' });
  });

  const {
    isChooser,
    loading: isChooserLoading,
    error: isChooserError,
  } = useIsChooser(gameId as string, teamId as string);
  const { rounds, loading: roundsLoading, error: roundsError } = useAllRounds(gameId as string);

  if (roundsError || isChooserError) return <ErrorScreen inline />;
  if (roundsLoading || isChooserLoading) return <LoadingScreen inline />;
  if (!rounds || isChooser === null) return null;

  const endedRoundIds = new Set(rounds.filter((r) => r.dateEnd !== null).map((r) => r.id));

  const availableRounds = rounds
    .filter((r) => r.order === null)
    .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));

  const playedRounds = rounds.filter((r) => r.order !== null).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const isRoundDisabled = (roundId: string | undefined): boolean => {
    if (endedRoundIds.has(roundId as string)) return true;
    if (role === ParticipantRole.ORGANIZER) return false;
    if (role === ParticipantRole.PLAYER) return !isChooser;
    return true;
  };

  return (
    <div className="flex flex-1 flex-row min-h-0">
      {/* Available rounds — always visible */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-2 pb-8">
        {availableRounds.length > 0 && (
          <section className={clsx('flex flex-col gap-2 mx-auto', isMobile ? 'w-3/4' : 'w-1/2')}>
            <SectionLabel>{intl.formatMessage(messages.sectionAvailable)}</SectionLabel>
            <div className="flex flex-col gap-1.5 md:gap-2">
              {availableRounds.map((round) => (
                <GameHomeRoundItem
                  key={round.id}
                  round={round}
                  isDisabled={isHandling || isRoundDisabled(round.id)}
                  onSelectRound={() => handleSelect(round.id as string)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {!isMobile && (
        <>
          {/* Vertical center divider — desktop only */}
          <div className="hidden md:block w-px bg-slate-700/60 shrink-0" />
          {/* Completed rounds — desktop only */}
          <div className="hidden md:flex flex-1 flex-col overflow-auto px-4 md:px-8 py-2 pb-8">
            {playedRounds.length > 0 && (
              <section className="flex flex-col gap-2 w-1/2 mx-auto">
                <SectionLabel muted>{intl.formatMessage(messages.sectionCompleted)}</SectionLabel>
                <div className="flex flex-col gap-1.5 md:gap-2">
                  {playedRounds.map((round) => (
                    <GameHomeRoundItem
                      key={round.id}
                      round={round}
                      isDisabled={isHandling || isRoundDisabled(round.id)}
                      onSelectRound={() => handleSelect(round.id as string)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SectionLabel({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-widest px-1 mb-1 ${muted ? 'text-slate-500' : 'text-slate-400'}`}
    >
      {children}
    </p>
  );
}

interface GameHomeRoundItemProps {
  round: AnyRound;
  isDisabled: boolean;
  onSelectRound: () => void;
}

function GameHomeRoundItem({ round, isDisabled, onSelectRound }: GameHomeRoundItemProps) {
  const intl = useIntl();
  type TS = { seconds: number; nanoseconds?: number };

  const isEnded = !!round.dateEnd;

  const secondaryText = (): string => {
    if (!round.dateStart) return '';
    const startTime = timestampToShortTime(round.dateStart as TS, intl.locale as Locale);
    if (!round.dateEnd) {
      const elapsed = formatDuration(timestampElapsedSeconds(round.dateStart as TS), intl.locale as Locale);
      return intl.formatMessage(messages.roundStarted, { time: startTime, elapsed });
    }
    const duration = formatDuration(
      timestampElapsedSeconds(round.dateStart as TS, round.dateEnd as TS),
      intl.locale as Locale
    );
    return intl.formatMessage(messages.roundEnded, {
      time: timestampToShortTime(round.dateEnd as TS, intl.locale as Locale),
      duration,
    });
  };

  return (
    <div
      className={
        isEnded
          ? 'rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900/50'
          : 'rounded-xl overflow-hidden border border-slate-600 bg-slate-800'
      }
    >
      <button
        type="button"
        disabled={isDisabled}
        onClick={onSelectRound}
        className="w-full flex items-center gap-4 px-4 py-2.5 md:py-3 bg-transparent hover:bg-[rgba(148,163,184,0.07)] disabled:opacity-100"
      >
        <span className="flex items-center justify-center shrink-0">
          <Avatar className="size-[34px] md:size-10">
            <AvatarFallback
              className="text-white"
              style={{ backgroundColor: isEnded ? 'rgba(71, 85, 105, 0.6)' : '#1976d2' }}
            >
              <RoundTypeIcon roundType={round.type!} className={isEnded ? 'size-4' : 'size-5'} />
            </AvatarFallback>
          </Avatar>
        </span>

        <span className="flex flex-col items-start text-left">
          <span
            className={`text-base md:text-lg 2xl:text-xl font-medium ${isEnded ? 'line-through text-slate-500' : 'text-slate-100'}`}
          >
            {round.title}
          </span>
          <span className={`text-xs md:text-sm mt-0.5 ${isEnded ? 'text-slate-600' : 'text-slate-400'}`}>
            {secondaryText()}
          </span>
        </span>
      </button>
    </div>
  );
}
