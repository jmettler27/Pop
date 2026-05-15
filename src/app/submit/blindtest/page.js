'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitBlindtestQuestionForm from '@/frontend/components/question-forms/SubmitBlindtestQuestionForm';
import { QuestionType } from '@/models/questions/QuestionType';

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
