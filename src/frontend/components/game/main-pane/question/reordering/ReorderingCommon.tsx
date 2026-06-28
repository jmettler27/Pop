'use client';

import { useMemo, useState } from 'react';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  ListItemIcon,
  Typography,
} from '@mui/material';
import { clsx } from 'clsx';
import { useIntl } from 'react-intl';

import CurrentRoundQuestionOrder from '@/frontend/components/game/main-pane/question/QuestionHeader';
import NoteButton from '@/frontend/components/game/NoteButton';
import { QuestionTypeIcon } from '@/frontend/helpers/question-types';
import useGameRepositories from '@/frontend/hooks/useGameRepositories';
import defineMessages from '@/frontend/i18n/defineMessages';
import { questionTypeToTitle } from '@/models/questions/question-type';
import { GameReorderingQuestion, Ordering, ReorderingItem, ReorderingQuestion } from '@/models/questions/reordering';
import Team from '@/models/team';
import { topicToEmoji } from '@/models/topic';
import type { Topic } from '@/models/topic';
import { Player } from '@/models/users/player';

export const messages = defineMessages('frontend.game.middle.ReorderingMiddlePane', {
  submitOrdering: 'Submit ordering',
  confirmDialogTitle: 'Are you sure you want to submit this ordering?',
  confirmDialogMessage: 'Please review your ordering before submitting:',
  teammateSubmitted: 'Your teammate has already submitted!',
  youSubmitted: 'Your ordering has been submitted!',
  yourScore: 'Your score: {score}/{maxScore}',
  placed: 'Placed #{position}',
  noSubmission: 'No answer',
  noOrderingsSubmitted: 'No orderings were submitted this round',
});

export function ReorderingQuestionHeader({ baseQuestion }: { baseQuestion: ReorderingQuestion }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="flex flex-row items-center justify-center space-x-1">
        <QuestionTypeIcon questionType={baseQuestion.type} fontSize={{ xs: 28, md: 50 }} />
        <h1 className="text-xs md:text-xl 2xl:text-5xl">
          {topicToEmoji(baseQuestion.topic as Topic)}{' '}
          <strong>
            {questionTypeToTitle(baseQuestion.type)} <CurrentRoundQuestionOrder />
          </strong>
        </h1>
      </div>
      <div className="flex flex-row items-center justify-center space-x-1">
        <h2 className="text-xs md:text-lg 2xl:text-4xl">{baseQuestion.title}</h2>
        {baseQuestion.note && <NoteButton note={baseQuestion.note} />}
      </div>
    </div>
  );
}

interface ReorderingItemAccordionProps {
  item: ReorderingItem;
  displayOrder: number;
  expanded: boolean;
  onAccordionChange: () => void;
  teamSubmitted?: boolean;
  teamPlacedAt?: number;
  isCorrect?: boolean;
}

export function ReorderingItemAccordion({
  item,
  displayOrder,
  expanded,
  onAccordionChange,
  teamSubmitted = false,
  teamPlacedAt,
  isCorrect,
}: ReorderingItemAccordionProps) {
  const intl = useIntl();

  return (
    <Accordion
      className="flex-grow"
      expanded={expanded}
      onChange={onAccordionChange}
      disabled={false}
      disableGutters
      sx={{
        ...(teamSubmitted && {
          borderLeft: '4px solid',
          borderLeftColor: isCorrect ? 'success.main' : 'error.main',
          bgcolor: isCorrect ? 'rgba(46, 125, 50, 0.08)' : 'rgba(211, 47, 47, 0.08)',
        }),
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <ListItemIcon className="flex items-center">
          {teamSubmitted &&
            (isCorrect ? (
              <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
            ) : (
              <CancelIcon sx={{ color: 'error.main', mr: 1 }} />
            ))}
          <Typography variant="h6" className="font-bold">
            {displayOrder + 1}.
          </Typography>
        </ListItemIcon>
        <div className="flex flex-col flex-grow">
          <Typography sx={{ marginRight: '10px' }} variant="h6">
            {item.title}
          </Typography>
          {teamSubmitted && !isCorrect && teamPlacedAt !== undefined && (
            <div className="flex items-center text-sm text-red-500 dark:text-red-400 mt-1">
              <SwapVertIcon fontSize="small" className="mr-1" />
              <span>{intl.formatMessage(messages.placed, { position: teamPlacedAt + 1 })}</span>
            </div>
          )}
        </div>
      </AccordionSummary>

      <AccordionDetails>
        <Typography sx={{ color: 'text.secondary' }} variant="h6">
          {item.explanation}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}

interface ReorderingResultsTableProps {
  gameQuestion: GameReorderingQuestion;
  baseQuestion: ReorderingQuestion;
}

export function ReorderingResultsTable({ gameQuestion, baseQuestion }: ReorderingResultsTableProps) {
  const intl = useIntl();
  const gameRepositories = useGameRepositories();
  if (!gameRepositories) return null;
  const { teamRepo, playerRepo } = gameRepositories;
  const { teams, loading: teamsLoading } = teamRepo.useAllTeamsOnce();
  const { players, loading: playersLoading } = playerRepo.useAllPlayersOnce();

  if (teamsLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <CircularProgress />
      </div>
    );
  }
  if (!teams || !players) return null;

  const orderings = gameQuestion.orderings ?? [];
  const noOrderings = orderings.length === 0;

  const sortedTeams = [...teams].sort((a, b) => {
    const aOrd = orderings.find((o) => o.teamId === a.id);
    const bOrd = orderings.find((o) => o.teamId === b.id);
    if (!aOrd && !bOrd) return 0;
    if (!aOrd) return 1;
    if (!bOrd) return -1;
    return bOrd.score - aOrd.score;
  });

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {noOrderings && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600/50 bg-slate-800/60 text-slate-400 text-sm 2xl:text-base">
          <span>🤔</span>
          <span>{intl.formatMessage(messages.noOrderingsSubmitted)}</span>
        </div>
      )}
      {sortedTeams.map((team) => {
        const ordering = orderings.find((o) => o.teamId === team.id);
        const player = ordering ? players.find((p) => p.id === ordering.playerId) : null;
        return (
          <ReorderingTeamResultRow
            key={team.id}
            team={team}
            player={player}
            ordering={ordering}
            baseQuestion={baseQuestion}
          />
        );
      })}
    </div>
  );
}

interface ReorderingTeamResultRowProps {
  team: Team;
  player: Player | null | undefined;
  ordering: Ordering | undefined;
  baseQuestion: ReorderingQuestion;
}

function ReorderingTeamResultRow({ team, player, ordering, baseQuestion }: ReorderingTeamResultRowProps) {
  const intl = useIntl();
  const [expandedItemIdx, setExpandedItemIdx] = useState<number | false>(false);
  const items = baseQuestion.items ?? [];
  const maxScore = items.length;
  const score = ordering?.score ?? 0;

  const teamPlacementMap = useMemo(() => {
    if (!ordering) return {} as Record<number, number>;
    const map: Record<number, number> = {};
    ordering.ordering.forEach((itemIdx, positionPlaced) => {
      map[itemIdx] = positionPlaced;
    });
    return map;
  }, [ordering]);

  const isPerfect = !!ordering && score === maxScore;
  const isGood = !!ordering && score >= maxScore / 2;

  return (
    <Accordion
      disableGutters
      disabled={!ordering}
      sx={{
        borderRadius: '16px !important',
        border: '2px solid',
        borderColor: !ordering
          ? 'rgba(30,41,59,1)'
          : isPerfect
            ? 'rgb(34,197,94)'
            : isGood
              ? 'rgb(234,179,8)'
              : 'rgb(71,85,105)',
        bgcolor: !ordering ? 'rgba(15,23,42,0.3)' : isPerfect ? 'rgba(34,197,94,0.1)' : 'rgba(30,41,59,0.6)',
        opacity: !ordering ? 0.4 : 1,
        transition: 'all 300ms',
        '&:before': { display: 'none' },
        '&.Mui-disabled': { opacity: !ordering ? 0.4 : 1 },
        '& .MuiAccordionDetails-root .MuiAccordion-root': { boxShadow: 'none' },
      }}
    >
      <AccordionSummary expandIcon={ordering ? <ExpandMoreIcon /> : null}>
        <div className="flex items-center gap-3 w-full pr-2">
          <div className="w-10 h-10 2xl:w-12 2xl:h-12 rounded-full overflow-hidden flex-shrink-0 bg-slate-700 border border-slate-600 flex items-center justify-center text-sm font-bold text-slate-300 select-none">
            {player?.image ? (
              <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <span>{player?.name?.[0]?.toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-base 2xl:text-lg truncate text-slate-100">{team.name}</span>
            {player && <span className="text-xs 2xl:text-sm text-slate-400 truncate">{player.name}</span>}
          </div>
          {ordering ? (
            <span
              className={clsx(
                'text-xl 2xl:text-2xl font-bold tabular-nums flex-shrink-0',
                isPerfect ? 'text-green-400' : isGood ? 'text-yellow-400' : 'text-red-400'
              )}
            >
              {score}/{maxScore}
            </span>
          ) : (
            <span className="text-sm italic text-slate-500 flex-shrink-0">
              {intl.formatMessage(messages.noSubmission)}
            </span>
          )}
        </div>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        <Box className="rounded-b-2xl overflow-hidden bg-white dark:bg-slate-900">
          {items.map((_, idx) => (
            <ReorderingItemAccordion
              key={idx}
              item={items[idx]!}
              displayOrder={idx}
              expanded={expandedItemIdx === idx}
              onAccordionChange={() => setExpandedItemIdx(expandedItemIdx === idx ? false : idx)}
              teamSubmitted
              teamPlacedAt={teamPlacementMap[idx]}
              isCorrect={teamPlacementMap[idx] === idx}
            />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

interface ReorderingEndViewProps {
  gameQuestion: GameReorderingQuestion;
  baseQuestion: ReorderingQuestion;
}

export function ReorderingEndView({ gameQuestion, baseQuestion }: ReorderingEndViewProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xl 2xl:max-w-2xl max-h-full overflow-y-auto py-4 px-4">
      <ReorderingResultsTable gameQuestion={gameQuestion} baseQuestion={baseQuestion} />
    </div>
  );
}
