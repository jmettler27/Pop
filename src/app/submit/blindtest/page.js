'use client';

import { QuestionType } from '@/backend/models/questions/QuestionType';

import SubmitBlindtestQuestionForm from '@/frontend/components/forms/submit-question/SubmitBlindtestQuestionForm';
import QuestionFormHeader from '@/frontend/components/forms/QuestionFormHeader';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';

const QUESTION_TYPE = QuestionType.BLINDTEST;

export default function Page() {
  const { data: session } = useSession();

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitBlindtestQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
