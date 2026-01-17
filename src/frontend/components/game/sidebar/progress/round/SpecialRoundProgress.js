import { topicToEmoji } from '@/backend/models/Topic';
import { GameStatus } from '@/backend/models/games/GameStatus';
import { UserRole } from '@/backend/models/users/User';
import { SpecialRoundStatus } from '@/backend/models/rounds/Special';

import { THEME_SECTION_TEXT, THEME_TEXT } from '@/backend/utils/question/theme';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { useDocumentData, useCollection, useCollectionOnce, useDocumentDataOnce } from 'react-firebase-hooks/firestore';

import { useRoleContext } from '@/frontend/contexts';

import { useParams } from 'next/navigation';

import { useState, useEffect } from 'react';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import LoadingScreen from '@/frontend/components/LoadingScreen';

import { CircularProgress } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import clsx from 'clsx';

export default function SpecialRoundProgress({ game, round }) {
  switch (round.status) {
    case SpecialRoundStatus.HOME:
      return <SpecialRoundHomeProgress round={round} />;
    case SpecialRoundStatus.THEME_ACTIVE:
    case SpecialRoundStatus.THEME_END:
      return <SpecialRoundThemeProgress game={game} round={round} />;
  }
}

/**
 * Sidebar visible in the special round home screen
 */
function SpecialRoundHomeProgress({ round, lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();

  const gameThemesCollectionRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'themes');
  const [gameThemes, gameThemesLoading, gameThemesError] = useCollection(
    query(gameThemesCollectionRef, where('order', '!=', null), orderBy('order', 'asc'))
  );

  const [teams, teamsLoading, teamsError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'teams'));

  if (gameThemesError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameThemesError)}</strong>
      </p>
    );
  }
  if (teamsError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(teamsError)}</strong>
      </p>
    );
  }
  if (gameThemesLoading || teamsLoading) {
    return <CircularProgress />;
  }
  if (!gameThemes || !teams) {
    return <></>;
  }

  const sortedGameThemes = gameThemes.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return (
    <div className="w-full m-1 p-1">
      {sortedGameThemes.map((gameTheme) => {
        const themeHasEnded = gameTheme.dateEnd != null;
        const themeIsCurrent = gameTheme.id === round.currentTheme;

        const playerTeamId = gameTheme.teamId;
        const playerTeam = playerTeamId ? teams.docs.find((doc) => doc.id === playerTeamId).data() : null;

        return (
          <Accordion
            key={gameTheme.id}
            expanded={true}
            disableGutters
            elevation={0}
            className={`text-inherit bg-inherit`}
            sx={{
              border: `0.5px solid ${playerTeam && playerTeam.color}}`,
            }}
          >
            <AccordionSummary aria-controls="panel1a-content" id="panel1a-header">
              <Typography className={clsx(themeIsCurrent && 'text-orange-300')}>
                <span className="font-bold">
                  {THEME_TEXT[lang]} {gameTheme.order + 1}
                </span>
                : {gameTheme.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>Team: {playerTeam ? playerTeam.name : 'None'}</Typography>
              <Typography>Score: {gameTheme.score}</Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
}

/**
 * Sidebar visible in a special round theme
 */
function SpecialRoundThemeProgress({ round, lang = DEFAULT_LOCALE }) {
  const { id: gameId } = useParams();
  const themeId = round.currentTheme;

  const gameSectionsRef = collection(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'themes', themeId, 'sections');
  const [gameSections, gameSectionsLoading, gameSectionsError] = useCollection(query(gameSectionsRef));

  const gameThemeRef = doc(GAMES_COLLECTION_REF, gameId, 'rounds', round.id, 'themes', themeId);
  const [gameTheme, gameThemeLoading, gameThemeError] = useDocumentData(gameThemeRef);

  const themeRef = doc(QUESTIONS_COLLECTION_REF, themeId);
  const [theme, themeLoading, themeError] = useDocumentDataOnce(themeRef);

  const [teams, teamsLoading, teamsError] = useCollectionOnce(collection(GAMES_COLLECTION_REF, gameId, 'teams'));

  const [expanded, setExpanded] = useState(false);

  // Expand the question's accordion whenever the current question changes or the game status changes (question start -> question_end)
  useEffect(() => {
    if (!gameTheme || gameTheme.currentSectionIdx === null) return;
    setExpanded(gameTheme.currentSectionIdx);
  }, [gameTheme]);

  if (gameSectionsError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameSectionsError)}</strong>
      </p>
    );
  }
  if (gameThemeError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(gameThemeError)}</strong>
      </p>
    );
  }
  if (themeError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(themeError)}</strong>
      </p>
    );
  }
  if (teamsError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(teamsError)}</strong>
      </p>
    );
  }
  if (themeLoading || gameSectionsLoading || gameThemeLoading || teamsLoading) {
    return <LoadingScreen />;
  }
  if (!theme || !gameSections || !gameTheme || !teams) {
    return <></>;
  }

  const { currentSectionIdx } = gameTheme;
  const currentSectionId = theme.details.sections[currentSectionIdx];

  const sortedGameSections = theme.details.sections
    .map((sectionId) => gameSections.docs.find((doc) => doc.id === sectionId))
    .map((doc) => ({ id: doc.id, ...doc.data() }));
  const currentGameSection = sortedGameSections.find((section) => section.id === currentSectionId);

  const isExpanded = (sectionIdx) => expanded === sectionIdx;

  const handleAccordionChange = (sectionIdx) => {
    setExpanded(isExpanded(sectionIdx) ? false : sectionIdx);
  };

  const hasEnded = (idx) => idx < currentSectionIdx;
  const isCurrent = (idx) => idx === currentSectionIdx;
  const hasNotStarted = (idx) => idx >= currentSectionIdx;

  const playerTeamId = gameTheme.teamId;
  const playerTeam = playerTeamId ? teams.docs.find((doc) => doc.id === playerTeamId).data() : null;

  return (
    <>
      <h2 className="text-lg">
        {topicToEmoji(theme.topic)}{' '}
        <strong>
          {THEME_TEXT[lang]} {gameTheme.order + 1}
        </strong>
        : {theme.details.title}
      </h2>

      <div className="w-full m-1 px-2">
        {sortedGameSections.map((gameSection, idx) => (
          <ThemeSectionAccordion
            key={gameSection.id}
            themeId={themeId}
            sectionId={gameSection.id}
            sectionOrder={idx}
            hasEnded={hasEnded(idx)}
            isCurrent={isCurrent(idx)}
            hasNotStarted={hasNotStarted(idx)}
            onAccordionChange={() => handleAccordionChange(idx)}
            expanded={isExpanded(idx)}
            gameSection={gameSection}
            currentGameSection={currentGameSection}
            playerTeam={playerTeam}
          />
        ))}
      </div>
    </>
  );
}

function ThemeSectionAccordion({
  themeId,
  sectionId,
  sectionOrder,
  hasEnded,
  isCurrent,
  hasNotStarted,
  onAccordionChange,
  expanded,
  gameSection,
  currentGameSection,
  playerTeam,
  lang = DEFAULT_LOCALE,
}) {
  const myRole = useRoleContext();

  const showComplete = myRole === UserRole.ORGANIZER || hasEnded || isCurrent;
  console.log(sectionId, showComplete);

  const borderColor = () => {
    if (isCurrent) {
      // return 'border-orange-500'
      return '#f97316';
    }
    if (hasNotStarted) {
      // return 'border-gray-500'
      return '#6b7280';
    }
    if (showComplete && playerTeam) {
      return playerTeam.color;
    }
  };

  const borderWidth = () => {
    if (isCurrent) {
      return '2px';
    }
    return '1px';
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={onAccordionChange}
      disabled={!showComplete}
      className="rounded-lg"
      elevation={0}
      sx={{
        borderWidth: borderWidth(),
        borderStyle: 'solid',
        borderColor: borderColor(),
        backgroundColor: 'inherit',
        color: 'inherit',
      }}
      disableGutters
    >
      <AccordionSummary
        expandIcon={showComplete && <ExpandMoreIcon />}
        sx={{
          '& .MuiSvgIcon-root': {
            color: borderColor(),
          },
        }}
      >
        <SectionSummary
          themeId={themeId}
          sectionId={sectionId}
          sectionOrder={sectionOrder}
          showComplete={showComplete}
          isCurrent={isCurrent}
          lang={lang}
        />
      </AccordionSummary>

      <AccordionDetails>
        <SectionDetails
          gameSection={gameSection}
          sectionIsCurrent={isCurrent}
          sectionHasEnded={hasEnded}
          currentGameSection={currentGameSection}
          lang={lang}
        />
      </AccordionDetails>
    </Accordion>
  );
}

function SectionSummary({ themeId, sectionId, sectionOrder, showComplete, isCurrent, lang = DEFAULT_LOCALE }) {
  const sectionRef = doc(QUESTIONS_COLLECTION_REF, themeId, 'sections', sectionId);
  const [section, sectionLoading, sectionError] = useDocumentDataOnce(sectionRef);
  if (sectionError) {
    return (
      <p>
        <strong>Error: {JSON.stringify(sectionError)}</strong>
      </p>
    );
  }
  if (sectionLoading) {
    return <CircularProgress />;
  }
  if (!section) {
    return <></>;
  }

  return (
    <Typography className={clsx(isCurrent && 'text-orange-300')}>
      <span className="text-lg">
        <strong>
          {THEME_SECTION_TEXT[lang]} {sectionOrder + 1}
        </strong>
        : {section.title && `${showComplete || isCurrent ? section.title : '???'}`}
      </span>
    </Typography>
  );
}

function SectionDetails({ gameSection, sectionIsCurrent, sectionHasEnded, currentGameSection, lang = DEFAULT_LOCALE }) {
  const { currentQuestionIdx } = currentGameSection;

  return (
    <ol className="list-decimal list-inside">
      {gameSection.question_status.map((status, idx) => {
        const questionisCurrent = sectionIsCurrent && idx === currentQuestionIdx;
        const questionHasEnded =
          sectionHasEnded ||
          (sectionIsCurrent && idx < currentQuestionIdx) ||
          (questionisCurrent && status === GameStatus.QUESTION_END);
        const questionHasNotStarted = !questionisCurrent && !questionHasEnded;

        return (
          <li
            key={idx}
            className={clsx(
              questionisCurrent && 'font-bold text-orange-300',
              questionHasEnded && 'line-through',
              questionHasNotStarted && 'text-gray-500'
            )}
          >
            Question {idx + 1} {questionHasEnded && status && (status === 'correct' ? '✅' : '❌')}
          </li>
        );
      })}
    </ol>
  );
}
