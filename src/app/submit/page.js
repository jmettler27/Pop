import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

import React from 'react';

import { QUESTION_TYPES, QUESTION_TYPE_TO_TITLE, QuestionTypeIcon } from '@/lib/utils/question_types';

export default async function Page({ }) {
    const session = await getServerSession(authOptions)

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 p-4 md:p-6">
            {QUESTION_TYPES.map((questionType, index) => (
                <QuestionTypeComponent key={index} questionType={questionType} />
            ))}
        </section>
    )

}

import Link from 'next/link'

import Image from 'next/image';
import questionPic from '../../../public/mcq-correct.png'

import { questionTypeToTitle } from '@/lib/utils/question_types';
import { DEFAULT_LOCALE } from '@/lib/utils/locales';

function QuestionTypeComponent({ questionType, lang = DEFAULT_LOCALE }) {
    return (
        <div className="relative group overflow-hidden rounded-lg">
            <QuestionTypeIcon questionType={questionType} fontSize={40} />
            <div className="bg-white px-4 py-2 dark:bg-gray-950">
                <h3 className="text-lg md:text-xl font-semibold dark:text-gray-500">{questionTypeToTitle(questionType, lang)}</h3>
                <p className="text-lg text-gray-500 dark:text-gray-400">{QUESTION_TYPE_TO_DESCRIPTION[lang][questionType]}</p>
                <Link href={'/submit/' + questionType}>{CREATE_NEW_QUESTION[lang]}</Link>
            </div>
        </div>
    );
}

export const CREATE_NEW_QUESTION = {
    'en': "Create a new question",
    'fr-FR': "Créer une nouvelle question"
}


const QUESTION_TYPE_TO_DESCRIPTION = {
    'en': {
        'progressive_clues': "What's hidden behind these clues?",
        'image': "What's hidden behind the image?",
        'emoji': "What's hidden behind the emojis?",
        'blindtest': "What's hidden behind this song or sound?",
        'quote': "Fill the information about this quote.",
        'enum': "List as many elements as you can.",
        'odd_one_out': "Select only the correct proposals.",
        'matching': "Match the elements together.",
        'mcq': "What's the answer?",
        'basic': "One question, one answer. Simple as that."
    },
    'fr-FR': {
        'progressive_clues': "Qu'est-ce qui se cache derrière ces indices ?",
        'image': "Qu'est-ce qui se cache derrière cette image ?",
        'emoji': "Qu'est-ce qui se cache derrière ces emojis ?",
        'blindtest': "Qu'est-ce qui se cache derrière cet audio ?",
        'quote': "Complétez les informations sur cette réplique.",
        'enum': "Listez autant d'éléments que vous pouvez.",
        'odd_one_out': "Quel est l'intrus ?",
        'matching': "Liez correctement les éléments ensemble.",
        'mcq': "Une question, plusieurs choix. Laquelle est la bonne ?",
        'basic': "Une question, une réponse. Tout simplement."
    }
}