import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';

import { Avatar, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { handleRoundSelected } from '@/backend/services/round/actions';
import ErrorScreen from '@/frontend/components/ErrorScreen';
import LoadingScreen from '@/frontend/components/LoadingScreen';
import { type Locale } from '@/frontend/helpers/locales';
import { RoundTypeIcon } from '@/frontend/helpers/question-types';
import { formatDuration, timestampElapsedSeconds, timestampToHour } from '@/frontend/helpers/time';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import useIsMobile from '@/frontend/hooks/useIsMobile';
import useRole from '@/frontend/hooks/useRole';
import useTeam from '@/frontend/hooks/useTeam';
import useUser from '@/frontend/hooks/useUser';
import defineMessages from '@/frontend/i18n/defineMessages';
import { RoundType } from '@/models/rounds/round-type';
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
  const params = useParams();
  const gameId = params.id;

  const myRole = useRole();
  const myTeam = useTeam();
  const user = useUser();
  const isMobile = useIsMobile();
  const intl = useIntl();

  const [handleSelect, isHandling] = useAsyncAction(async (roundId: string, roundType: RoundType) => {
    await handleRoundSelected(roundType, gameId as string, roundId, user?.id as string);
  });

  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;

  const { roundRepo, chooserRepo } = gameRepositories;
  const { rounds, loading: roundsLoading, error: roundsError } = roundRepo.useAllRounds();
  const { isChooser, loading: isChooserLoading, error: isChooserError } = chooserRepo.useIsChooser(myTeam as string);

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
    if (myRole === ParticipantRole.ORGANIZER) return false;
    if (myRole === ParticipantRole.PLAYER) return !isChooser;
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
                  onSelectRound={() => handleSelect(round.id as string, round.type as RoundType)}
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
                      onSelectRound={() => handleSelect(round.id as string, round.type as RoundType)}
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
    const startTime = timestampToHour(round.dateStart as TS, intl.locale as Locale);
    if (!round.dateEnd) {
      const elapsed = formatDuration(timestampElapsedSeconds(round.dateStart as TS), intl.locale as Locale);
      return intl.formatMessage(messages.roundStarted, { time: startTime, elapsed });
    }
    const duration = formatDuration(
      timestampElapsedSeconds(round.dateStart as TS, round.dateEnd as TS),
      intl.locale as Locale
    );
    return intl.formatMessage(messages.roundEnded, {
      time: timestampToHour(round.dateEnd as TS, intl.locale as Locale),
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
      <ListItemButton
        disabled={isDisabled}
        onClick={onSelectRound}
        sx={{
          py: { xs: 1.25, md: 1.5 },
          bgcolor: 'transparent',
          '&.Mui-disabled': { opacity: 1 },
          '&:hover': { bgcolor: 'rgba(148, 163, 184, 0.07)' },
        }}
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              bgcolor: isEnded ? 'rgba(71, 85, 105, 0.6)' : 'primary.main',
              width: { xs: 34, md: 40 },
              height: { xs: 34, md: 40 },
            }}
          >
            <RoundTypeIcon roundType={round.type!} fontSize={isEnded ? 16 : 20} />
          </Avatar>
        </ListItemAvatar>

        <ListItemText
          primary={round.title}
          primaryTypographyProps={{
            className: `text-base md:text-lg 2xl:text-xl font-medium ${isEnded ? 'line-through text-slate-500' : 'text-slate-100'}`,
          }}
          secondary={secondaryText()}
          secondaryTypographyProps={{
            className: `text-xs md:text-sm mt-0.5 ${isEnded ? 'text-slate-600' : 'text-slate-400'}`,
          }}
        />
      </ListItemButton>
    </div>
  );
}
