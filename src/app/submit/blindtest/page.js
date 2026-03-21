'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitBlindtestQuestionForm from '@/frontend/components/question-forms/SubmitBlindtestQuestionForm';

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
