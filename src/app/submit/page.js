import {
  QuestionType,
  prependQuestionTypeWithEmoji,
  questionTypeToDescription,
} from '@/backend/models/questions/QuestionType';

import { DEFAULT_LOCALE } from '@/frontend/utils/locales';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/frontend/components/card';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import React from 'react';

export default async function Page({ lang = DEFAULT_LOCALE }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  return (
    <div className="flex flex-col">
      <h1 className="text-4xl font-bold text-center p-4 md:p-6">🆕 {CREATE_NEW_QUESTION[lang]}</h1>
      <section className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 p-4 md:p-6">
        {Object.values(QuestionType).map((type, index) => (
          <SubmitQuestionCard key={index} questionType={type} lang={lang} />
        ))}
      </section>
    </div>
  );
}

function SubmitQuestionCard({ questionType, lang }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{prependQuestionTypeWithEmoji(questionType, lang)}</CardTitle>
      </CardHeader>

      <CardContent>
        <span className="text-xl">{questionTypeToDescription(questionType, lang)}</span>
      </CardContent>

      <CardFooter>
        <Link className="text-xl" href={'/submit/' + questionType}>
          {CREATE_NEW_QUESTION[lang]}
        </Link>
      </CardFooter>
    </Card>
  );
}

const CREATE_NEW_QUESTION = {
  en: 'Create a new question',
  'fr-FR': 'Créer une nouvelle question',
};
