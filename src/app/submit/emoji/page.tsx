'use client';

import { redirect } from 'next/navigation';

import { useSession } from 'next-auth/react';

import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitEmojiQuestionForm from '@/frontend/components/question-forms/SubmitEmojiQuestionForm';
import { QuestionType } from '@/models/questions/question-type';

const QUESTION_TYPE = QuestionType.EMOJI;

export default function Page() {
  const { data: session } = useSession();

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitEmojiQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
