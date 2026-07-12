'use client';

import { useSession } from 'next-auth/react';

import QuestionFormHeader from '@/frontend/components/common/QuestionFormHeader';
import SubmitNaguiQuestionForm from '@/frontend/components/question-forms/SubmitNaguiQuestionForm';
import { QuestionType } from '@/models/questions/question-type';

const QUESTION_TYPE = QuestionType.NAGUI;

export default function Page() {
  const { data: session } = useSession();

  // Auth and guest guarding are enforced by middleware; session is guaranteed here.
  if (!session?.user) return null;

  return (
    <>
      <QuestionFormHeader questionType={QUESTION_TYPE} />
      <SubmitNaguiQuestionForm userId={session.user.id} inSubmitPage={true} />
    </>
  );
}
