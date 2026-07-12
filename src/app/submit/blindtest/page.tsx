'use client';

import { useSession } from 'next-auth/react';

import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitBlindtestQuestionForm from '@/frontend/components/question-forms/SubmitBlindtestQuestionForm';
import { QuestionType } from '@/models/questions/question-type';

const QUESTION_TYPE = QuestionType.BLINDTEST;

export default function Page() {
  const { data: session } = useSession();

  // Auth and guest guarding are enforced by middleware; session is guaranteed here.
  if (!session?.user) return null;

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitBlindtestQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
