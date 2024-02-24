'use client'

import React, { useRef } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import { MyNumberInput, MyTextInput } from '@/app/components/forms/StyledFormComponents'
import { UploadImage } from '@/app/components/forms/UploadFile';
import SubmitFormButton from '@/app/components/forms/SubmitFormButton';
import SelectQuestionTopic from '@/app/submit/components/SelectQuestionTopic';
import QuestionFormHeader from '@/app/submit/components/QuestionFormHeader';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { topicSchema } from '@/lib/utils/topics';
import { stringSchema } from '@/lib/utils/forms';
import { getFileFromRef, imageFileSchema } from '@/lib/utils/files';
import { IMAGE_ANSWER_EXAMPLE, IMAGE_ANSWER_MAX_LENGTH, IMAGE_TITLE_EXAMPLE, IMAGE_TITLE_MAX_LENGTH } from '@/lib/utils/question/image';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import { addNewQuestion } from '@/lib/firebase/firestore';
import { updateQuestionImage } from '@/lib/firebase/storage';
import { runTransaction, serverTimestamp } from 'firebase/firestore';
import { handleImageFormSubmission, handleQuestionFormSubmission } from '@/app/submit/actions';

import SelectLanguage from '@/app/submit/components/SelectLanguage';

import { useAsyncAction } from '@/lib/utils/async';
import { GAME_DEFAULT_TYPE, GAME_MAX_NUMBER_OF_PLAYERS, GAME_MIN_NUMBER_OF_PLAYERS, GAME_PARTICIPANT_NAME_MAX_LENGTH, GAME_TITLE_EXAMPLE, GAME_TITLE_MAX_LENGTH, gameTypeSchema } from '@/lib/utils/game';
import SelectGameType from './components/SelectGameType';
import { db } from '@/lib/firebase/firebase';
import { createGame } from './[id]/lib/create-game';

export default function Page({ }) {
    const { data: session } = useSession()
    const router = useRouter()

    const [createNewGame, isSubmitting] = useAsyncAction(async (values, userId, fileRef) => {
        try {
            const { title, type, lang, maxPlayers, organizerName } = values;

            const gameId = await createGame(title, type, lang, maxPlayers, organizerName, userId);
            console.log("Game ID:", gameId)
            // const image = getFileFromRef(fileRef);
            // if (image) {
            //     await updateQuestionImage(image, gameId, questionId);
            // }

            router.push('/edit/' + gameId);
        } catch (error) {
            console.error("There was an error creating the game:", error)
            router.push('/')
        }
    });

    // Protected route
    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const user = session.user;

    const fileRef = useRef(null);

    const validationSchema = Yup.object({
        lang: localeSchema(),
        type: gameTypeSchema(),
        title: stringSchema(IMAGE_TITLE_MAX_LENGTH),
        maxPlayers: Yup.number().required().integer(),
        organizerName: stringSchema(GAME_PARTICIPANT_NAME_MAX_LENGTH),
        // imageFiles: imageFileSchema(fileRef),
    })

    return (
        <>
            <h1>Create a new game</h1>
            <Formik
                initialValues={{
                    type: GAME_DEFAULT_TYPE,
                    lang: DEFAULT_LOCALE,
                    title: '',
                    maxPlayers: GAME_MIN_NUMBER_OF_PLAYERS,
                    organizerName: '',
                    // imageFiles: ''

                }}
                onSubmit={async values => await createNewGame(values, user.id, fileRef)}
                validationSchema={validationSchema}
            >
                <Form>
                    <SelectLanguage labels={GAME_LANGUAGE_SELECTOR_LABELS} lang='en' name='lang' validationSchema={validationSchema} />

                    <SelectGameType lang='en' name='type' validationSchema={validationSchema} />

                    <MyTextInput
                        label="Give a title to the game"
                        name='title'
                        type='text'
                        placeholder={GAME_TITLE_EXAMPLE}
                        validationSchema={validationSchema}
                        maxLength={GAME_TITLE_MAX_LENGTH}
                    />

                    <MyNumberInput
                        label="How many players do you want AT MOST in your game?"
                        name='maxPlayers'
                        min={GAME_MIN_NUMBER_OF_PLAYERS} max={GAME_MAX_NUMBER_OF_PLAYERS}
                    // validationSchema={validationSchema}
                    />

                    <MyTextInput
                        label="What is your nickname?"
                        name='organizerName'
                        type='text'
                        placeholder={user.name}
                        validationSchema={validationSchema}
                        maxLength={GAME_PARTICIPANT_NAME_MAX_LENGTH}
                    />

                    <br />

                    <SubmitFormButton isSubmitting={isSubmitting} text="Create the game" />
                </Form>
            </Formik >
        </>
    );

}

const GAME_LANGUAGE_SELECTOR_LABELS = {
    'en': "What language is this game in?",
    'fr-FR': "Dans quelle langue est cette partie?"
}