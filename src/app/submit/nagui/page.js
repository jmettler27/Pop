'use client';

import { QuestionType } from '@/backend/models/questions/QuestionType';

import QuestionFormHeader from '@/frontend/components/forms/QuestionFormHeader';
import SubmitNaguiQuestionForm from '@/frontend/components/forms/submit-question/SubmitNaguiQuestionForm';

import { redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';

const QUESTION_TYPE = QuestionType.NAGUI;

export default function Page() {
  const { data: session } = useSession();

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitNaguiQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
