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
import AddCircleIcon from '@mui/icons-material/AddCircle';

export default async function Page({ lang = DEFAULT_LOCALE }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-4 md:py-6 px-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-lg">
              🆕 {CREATE_NEW_QUESTION[lang]}
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base">
              {lang === 'en'
                ? 'Choose a question type to get started'
                : 'Choisissez un type de question pour commencer'}
            </p>
          </div>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 p-4 md:p-8 pb-12">
            {Object.values(QuestionType).map((type, index) => (
              <SubmitQuestionCard key={index} questionType={type} lang={lang} />
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function SubmitQuestionCard({ questionType, lang }) {
  return (
    <Link href={'/submit/' + questionType} className="h-full no-underline group">
      <Card className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-blue-500 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300 pointer-events-none" />

        <CardHeader className="flex flex-row items-center justify-start pb-2 relative z-10">
          <CardTitle className="text-md sm:text-lg md:text-xl text-white group-hover:text-blue-400 transition-colors duration-300">
            {prependQuestionTypeWithEmoji(questionType, lang)}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 relative z-10">
          <p className="text-gray-300 text-xs md:text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
            {questionTypeToDescription(questionType, lang)}
          </p>
        </CardContent>

        <CardFooter className="pt-4 relative z-10">
          <div className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 group-hover:from-blue-500 group-hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/50 text-center text-xs md:text-sm">
            <AddCircleIcon sx={{ fontSize: '1.2em' }} />
            {CREATE_NEW_QUESTION[lang]}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

const CREATE_NEW_QUESTION = {
  en: 'Create a new question',
  'fr-FR': 'Créer une nouvelle question',
};
