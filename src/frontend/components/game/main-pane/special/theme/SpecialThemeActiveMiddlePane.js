import useGame from '@/frontend/hooks/useGame';
import useRole from '@/frontend/hooks/useRole';

import { GAMES_COLLECTION_REF, QUESTIONS_COLLECTION_REF } from '@/backend/firebase/firestore';
import { doc } from 'firebase/firestore';
import { useDocumentData, useDocumentOnce } from 'react-firebase-hooks/firestore';

import { clsx } from 'clsx';
import globalMessages from '@/i18n/globalMessages';

import LoadingScreen from '@/frontend/components/LoadingScreen';
import { useIntl } from 'react-intl';

import { ParticipantRole } from '@/backend/models/users/Participant';
import ErrorScreen from '@/frontend/components/ErrorScreen';
export default function SpecialThemeActiveMiddlePane({ theme, gameTheme }) {
  const currentThemeId = theme.id;
  const currentSectionId = theme.details.sections[gameTheme.currentSectionIdx];

  const sectionRef = doc(QUESTIONS_COLLECTION_REF, currentThemeId, 'sections', currentSectionId);
  const [section, sectionLoading, sectionError] = useDocumentData(sectionRef);

  if (sectionError) {
    return <ErrorScreen inline />;
  }
  if (sectionLoading) {
    return <LoadingScreen inline />;
  }
  if (!section) {
    return <></>;
  }

  return (
    <div className="h-full flex flex-col items-center">
      <div className="flex flex-col h-[10%] items-center justify-center">
        {/* <ThemeTitle theme={theme} /> */}
        <SectionTitle section={section} gameTheme={gameTheme} />
      </div>
      <div className="flex h-[90%] w-[80%] items-center justify-center overflow-auto">
        <SectionQuestions
          currentThemeId={currentThemeId}
          currentSectionId={currentSectionId}
          sectionQuestions={section.questions}
        />
      </div>
    </div>
  );
}

function SectionTitle({ section, gameTheme }) {
  const intl = useIntl();
  return (
    <h1 className="2xl:text-4xl">
      <span className="font-bold">
        {intl.formatMessage(globalMessages.level)} {gameTheme.currentSectionIdx + 1}
      </span>
      {section.title && `: ${section.title}`}
    </h1>
  );
}

function SectionQuestions({ currentThemeId, currentSectionId, sectionQuestions }) {
  const game = useGame();
  const myRole = useRole();

  const gameSectionRef = doc(
    GAMES_COLLECTION_REF,
    game.id,
    'rounds',
    game.currentRound,
    'themes',
    currentThemeId,
    'sections',
    currentSectionId
  );
  const [gameSection, gameSectionLoading, gameSectionError] = useDocumentData(gameSectionRef);
  if (gameSectionError) {
    return <ErrorScreen inline />;
  }
  if (gameSectionLoading) {
    return <LoadingScreen inline />;
  }
  if (!gameSection) {
    return <></>;
  }
  const currentQuestionIdx = gameSection.currentQuestionIdx;

  const isOrganizer = myRole === ParticipantRole.ORGANIZER;
  const myIndex = isOrganizer ? sectionQuestions.length - 1 : currentQuestionIdx;

  // Organizer: show everything

  const statusToColor = (status, idx) => {
    if (status === 'correct')
      // Question has been answered correctly
      return 'text-green-600';
    else if (status === 'wrong')
      // Question has been answered incorrectly
      return 'text-red-600'; // Question not answered yet
    else return isOrganizer && idx === currentQuestionIdx && 'text-orange-300';
  };

  return (
    <div className="flex flex-col space-y-10">
      {sectionQuestions.map((question, idx) => {
        const status = gameSection.question_status[idx];
        return (
          <div key={idx} className={clsx(!(idx <= myIndex) && 'opacity-0')}>
            {/* Question */}
            <p className={clsx('2xl:text-3xl font-bold', statusToColor(status, idx))}>{question.title}</p>

            {/* Answer */}
            <p className={clsx('2xl:text-3xl italic', !(status || isOrganizer) && 'opacity-0')}>{question.answer}</p>
          </div>
        );
      })}
    </div>
  );
}
