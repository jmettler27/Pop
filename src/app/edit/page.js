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

export default function Page({ lang = DEFAULT_LOCALE }) {
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

    // const fileRef = useRef(null);

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
            <h1>{CREATE_GAME[lang]}</h1>
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
                        label={GAME_TITLE_LABEL[lang]}
                        name='title'
                        type='text'
                        placeholder={GAME_TITLE_EXAMPLE}
                        validationSchema={validationSchema}
                        maxLength={GAME_TITLE_MAX_LENGTH}
                    />

                    <MyNumberInput
                        label={GAME_MAX_PLAYERS_LABEL[lang]}
                        name='maxPlayers'
                        min={GAME_MIN_NUMBER_OF_PLAYERS} max={GAME_MAX_NUMBER_OF_PLAYERS}
                    // validationSchema={validationSchema}
                    />

                    <MyTextInput
                        label={GAME_ORGANIZER_NAME_LABEL[lang]}
                        name='organizerName'
                        type='text'
                        placeholder={user.name}
                        validationSchema={validationSchema}
                        maxLength={GAME_PARTICIPANT_NAME_MAX_LENGTH}
                    />

                    <br />

                    <SubmitFormButton isSubmitting={isSubmitting} label={CREATE_GAME_SUBMIT_BUTTON_LABEL[lang]} />
                </Form>
            </Formik >
        </>
    );

}

const CREATE_GAME = {
    'en': "Create a new game",
    'fr-FR': "Créer une nouvelle partie"
}

const GAME_LANGUAGE_SELECTOR_LABELS = {
    'en': "Game language",
    'fr-FR': "Langue de la partie"
}

const GAME_TITLE_LABEL = {
    'en': "Game title",
    'fr-FR': "Titre de la partie"
}

const GAME_MAX_PLAYERS_LABEL = {
    'en': "Maximum number of players",
    'fr-FR': "Nombre maximum de joueurs"
}

const GAME_ORGANIZER_NAME_LABEL = {
    'en': "Choose a nickname for the game",
    'fr-FR': "Choisis un pseudo pour cette partie"
}

const CREATE_GAME_SUBMIT_BUTTON_LABEL = {
    'en': "Create",
    'fr-FR': "Créer"
}