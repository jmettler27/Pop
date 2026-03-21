'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import { QuestionType } from '@/backend/models/questions/QuestionType';
import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitBasicQuestionForm from '@/frontend/components/question-forms/SubmitBasicQuestionForm';

const QUESTION_TYPE = QuestionType.BASIC;

export default function Page() {
  const { data: session } = useSession();

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitBasicQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
