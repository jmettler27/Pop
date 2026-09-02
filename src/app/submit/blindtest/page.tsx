'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import QuestionFormHeader from '@/components/common/QuestionFormHeader';
import SubmitBlindtestQuestionForm from '@/components/question-forms/SubmitBlindtestQuestionForm';
import { QuestionType } from '@/models/questions/question-type';

const QUESTION_TYPE = QuestionType.BLINDTEST;

export default function Page() {
  const { data: session } = useSession();

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  if (session.user.isGuest) {
    redirect('/');
  }

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitBlindtestQuestionForm inSubmitPage={true} />
    </>
  );
}
