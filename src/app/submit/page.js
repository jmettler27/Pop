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

function QuestionTypeComponent({ questionType, lang = 'fr-FR' }) {
    return (
        <div className="relative group overflow-hidden rounded-lg">
            <QuestionTypeIcon questionType={questionType} fontSize={40} />
            <div className="bg-white px-4 py-2 dark:bg-gray-950">
                <h3 className="font-semibold text-lg md:text-xl">{questionTypeToTitle(questionType, lang)}</h3>
                <p className="text-lg text-gray-500 dark:text-gray-400">{QUESTION_TYPE_TO_DESCRIPTION[lang][questionType]}</p>
                <Link href={'/submit/' + questionType}>Submit a new question</Link>
            </div>
        </div>
    );
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
        'progressive_clues': "Qu'est-ce qui se cache derrière ces indices?",
        'image': "Qu'est-ce qui se cache derrière cette image?",
        'emoji': "Qu'est-ce qui se cache derrière ces emojis?",
        'blindtest': "Qu'est-ce qui se cache derrière cette chanson ou ce son?",
        'quote': "Complétez les informations sur cette citation.",
        'enum': "Listez autant d'éléments que vous pouvez.",
        'odd_one_out': "Ne sélectionnez que les propositions correctes.",
        'matching': "Liez ces élements ensemble.",
        'mcq': "Quelle est la réponse?",
        'basic': "Une question, une réponse. Tout simplement."
    }
}