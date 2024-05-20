'use client'

import React, { useRef } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import { MyNumberInput, MyTextInput } from '@/app/components/forms/StyledFormComponents'
import SubmitFormButton from '@/app/components/forms/SubmitFormButton';

import { DEFAULT_LOCALE, localeSchema } from '@/lib/utils/locales';
import { stringSchema } from '@/lib/utils/forms';
import { IMAGE_TITLE_MAX_LENGTH } from '@/lib/utils/question/image';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation'

import SelectLanguage from '@/app/submit/components/SelectLanguage';

import { useAsyncAction } from '@/lib/utils/async';
import { GAME_DEFAULT_TYPE, GAME_MAX_NUMBER_OF_PLAYERS, GAME_MIN_NUMBER_OF_PLAYERS, GAME_PARTICIPANT_NAME_MAX_LENGTH, GAME_TITLE_EXAMPLE, GAME_TITLE_MAX_LENGTH, gameTypeSchema } from '@/lib/utils/game';
import SelectGameType from './components/SelectGameType';
import { createGame } from './[id]/lib/create-game';

export default function Page({ }) {
    const { data: session } = useSession()
    const router = useRouter()

    const [createNewGame, isSubmitting] = useAsyncAction(async (values, userId) => {
        const { title, type, lang, maxPlayers, organizerName } = values;
        const gameId = await createGame(title, type, lang, maxPlayers, organizerName, userId);
        router.push('/edit/' + gameId);
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
                onSubmit={async values => {
                    try {
                        await createNewGame(values, user.id)
                    } catch (error) {
                        console.error("There was an error creating the game:", error)
                        router.push('/')
                    }
                }}
                validationSchema={validationSchema}
            >
                <Form>
                    <SelectLanguage labels={GAME_LANGUAGE_SELECTOR_LABELS} lang='fr-FR' name='lang' validationSchema={validationSchema} />

                    <SelectGameType lang='fr-FR' name='type' validationSchema={validationSchema} />

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