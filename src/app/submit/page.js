import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

import React from 'react';

import { QUESTION_TYPES, prependQuestionTypeWithEmoji } from '@/lib/utils/question_types';

export default async function Page({ lang = DEFAULT_LOCALE }) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }
    return (
        <div className='flex flex-col'>
            <h1 className='text-4xl font-bold text-center p-4 md:p-6'>🆕 {CREATE_NEW_QUESTION[lang]}</h1>
            <section className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 gap-4 p-4 md:p-6">
                {QUESTION_TYPES.map((questionType, index) => (
                    <SubmitQuestionCard key={index} questionType={questionType} lang={lang} />
                ))}
            </section>
        </div>
    )

}

import Link from 'next/link'

import { DEFAULT_LOCALE } from '@/lib/utils/locales';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/card';

function SubmitQuestionCard({ questionType, lang }) {
    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between' >
                <CardTitle>{prependQuestionTypeWithEmoji(questionType, lang)}</CardTitle>
            </CardHeader >

            <CardContent>
                <span className='text-xl'>{QUESTION_TYPE_TO_DESCRIPTION[lang][questionType]}</span>
            </CardContent>

            <CardFooter>
                <Link className='text-xl' href={'/submit/' + questionType}>{CREATE_NEW_QUESTION[lang]}</Link>
            </CardFooter>

        </Card>
    )
}

const CREATE_NEW_QUESTION = {
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
        'label': "Label the elements in this image.",
        'enum': "List as many elements as you can.",
        'odd_one_out': "Select only the correct proposals.",
        'matching': "Match the elements together.",
        'mcq': "One question, multiple choices. Which one is correct?",
        "nagui": "Hide, square or duo?",
        'basic': "One question, one answer. Simple as that."
    },
    'fr-FR': {
        'progressive_clues': "Qu'est-ce qui se cache derrière ces indices ?",
        'image': "Qu'est-ce qui se cache derrière cette image ?",
        'emoji': "Qu'est-ce qui se cache derrière ces emojis ?",
        'blindtest': "Qu'est-ce qui se cache derrière cet audio ?",
        'quote': "Complétez les informations sur cette réplique.",
        'label': "Décrivez les éléments de cette image.",
        'enum': "Listez autant d'éléments que vous pouvez.",
        'odd_one_out': "Quel est l'intrus ?",
        'matching': "Liez correctement les éléments ensemble.",
        'mcq': "Une question, plusieurs choix. Lequel est le bon ?",
        "nagui": "Cache, carré ou duo ?",
        'basic': "Une question, une réponse. Tout simplement."
    }
}