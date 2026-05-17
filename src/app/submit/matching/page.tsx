'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitMatchingQuestionForm from '@/frontend/components/question-forms/SubmitMatchingQuestionForm';
import { QuestionType } from '@/models/questions/question-type';

const QUESTION_TYPE = QuestionType.MATCHING;

export default function Page() {
  const { data: session } = useSession();

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitMatchingQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
