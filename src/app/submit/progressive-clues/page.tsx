'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitProgressiveCluesQuestionForm from '@/frontend/components/question-forms/SubmitProgressiveCluesQuestionForm';
import { QuestionType } from '@/models/questions/question-type';

const QUESTION_TYPE = QuestionType.PROGRESSIVE_CLUES;

export default function Page() {
  const { data: session } = useSession();

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitProgressiveCluesQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
