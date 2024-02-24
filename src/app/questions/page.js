'use client'

import React from 'react';

import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { QUESTIONS_COLLECTION_REF, USERS_COLLECTION_REF } from '@/lib/firebase/firestore';
import { collection, doc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useCollection, useCollectionOnce, useDocumentData, useDocumentDataOnce, useDocumentOnce } from 'react-firebase-hooks/firestore';

import { QUESTION_TYPES } from '@/lib/utils/question_types';
import { prependQuestionTypeWithEmoji } from '@/lib/utils/question_types';

import { QuestionCard } from '../components/questions/QuestionCard';


export default function Page({ }) {
    const { data: session } = useSession()
    // const q = query(QUESTIONS_COLLECTION_REF, where('type', '==', 'matching'), orderBy('createdAt', 'desc'), limit(10))
    // const querySnapshot = await getDocs(q)
    // querySnapshot.forEach((doc) => {
    //     console.log(doc.id, ' => ', doc.data());
    // });

    // const [questionsCollection, loading, error] = useCollectionOnce(q)
    // if (error) {
    //     return <p>Error: {error}</p>
    // }
    // if (loading) {
    //     return <p>Loading...</p>
    // }
    // if (!questionsCollection) {
    //     return <p>Questions not found</p>
    // }
    // const questions = questionsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // console.log(questions)


    // Protected route
    if (!session || !session.user) {
        redirect('/api/auth/signin');
    }

    return (
        <div className='grid gap-6 px-4 py-6'>
            {QUESTION_TYPES.map((questionType, idx) => <QuestionTypeSectionComponent key={idx} questionType={questionType} />)}
        </div>
    )

}

function QuestionTypeSectionComponent({ questionType, lang = 'en' }) {
    // Retrieve 10 questions of the given type
    const q = query(QUESTIONS_COLLECTION_REF, where('type', '==', questionType), limit(10))
    const [questionsCollection, loading, error] = useCollectionOnce(q)
    if (error) {
        return <p>Error: {error}</p>
    }
    if (loading) {
        return <p>Loading...</p>
    }
    if (!questionsCollection) {
        return <p>Questions not found</p>
    }
    const questions = questionsCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }))


    return (
        <section>
            <h2 className='text-2xl font-bold mb-4'>{prependQuestionTypeWithEmoji(questionType, lang)}</h2>
            <div className='grid grid-cols-1 xl:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4'>
                {questions.map(question => <QuestionCard key={question.id} question={question} />)}
            </div>
        </section>
    );
}


