'use client';

import React from 'react';
import { Form, Formik } from 'formik';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { MyNumberInput, MyTextInput } from '@/frontend/components/forms/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';
import SelectRoundScorePolicy from '@/frontend/components/forms/SelectRoundScorePolicy';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';

import Game from '@/backend/models/games/Game';
import CreateGameService from '@/backend/services/create-game/CreateGameService';
import { gameTitleSchema, participantNameSchema } from '@/frontend/utils/forms/game';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';

/* Validation */
import * as Yup from 'yup';

export const roundScorePolicySchema = () =>
  Yup.string().oneOf(Object.values(ScorePolicyType), 'Invalid round score policy.').required('Required.');

export default function Page({ lang = DEFAULT_LOCALE }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [createNewGame, isSubmitting] = useAsyncAction(async (values, user) => {
    const { title, type, lang, maxPlayers, roundScorePolicy, organizerName } = values;
    const createGameService = new CreateGameService();
    const gameId = await createGameService.createGame(
      title,
      'rounds',
      lang,
      maxPlayers,
      roundScorePolicy,
      organizerName,
      user.id,
      user.image
    );
    router.push('/edit/' + gameId);
  });

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }

  const user = session.user;

  const validationSchema = Yup.object({
    lang: localeSchema(),
    // type: gameTypeSchema(),
    title: gameTitleSchema(),
    maxPlayers: Yup.number()
      .required()
      .integer()
      .min(Game.MIN_NUM_PLAYERS, `Must have at least ${Game.MIN_NUM_PLAYERS} players`)
      .max(Game.MAX_NUM_PLAYERS, `Must have at most ${Game.MAX_NUM_PLAYERS} players`),
    roundScorePolicy: roundScorePolicySchema(),
    organizerName: participantNameSchema(),
  });

  return (
    <>
      <h1>{CREATE_GAME[lang]}</h1>
      <Formik
        initialValues={{
          // type: GAME_DEFAULT_TYPE,
          lang: DEFAULT_LOCALE,
          title: '',
          maxPlayers: Game.MIN_NUM_PLAYERS,
          roundScorePolicy: '',
          organizerName: '',
        }}
        onSubmit={async (values) => {
          try {
            await createNewGame(values, user);
          } catch (error) {
            console.error('There was an error creating the game:', error);
            router.push('/');
          }
        }}
        validationSchema={validationSchema}
      >
        <Form>
          <SelectLanguage
            labels={SELECT_GAME_LANGUAGE_LABEL}
            lang={lang}
            name="lang"
            validationSchema={validationSchema}
          />

          {/* <SelectGameType lang={lang} name='type' validationSchema={validationSchema} /> */}

          <MyTextInput
            label={GAME_TITLE_LABEL[lang]}
            name="title"
            type="text"
            placeholder={Game.TITLE_EXAMPLE}
            validationSchema={validationSchema}
            maxLength={Game.TITLE_MAX_LENGTH}
          />

          <MyNumberInput
            label={GAME_MAX_PLAYERS_LABEL[lang]}
            name="maxPlayers"
            min={Game.MIN_NUM_PLAYERS}
            max={Game.MAX_NUM_PLAYERS}
          />

          <SelectRoundScorePolicy lang={lang} name="roundScorePolicy" validationSchema={validationSchema} />

          <MyTextInput
            label={GAME_ORGANIZER_NAME_LABEL[lang]}
            name="organizerName"
            type="text"
            placeholder={user.name}
            validationSchema={validationSchema}
            maxLength={Game.PARTICIPANT_NAME_MAX_LENGTH}
          />

          <br />

          <SubmitFormButton isSubmitting={isSubmitting} label={CREATE_GAME_SUBMIT_BUTTON_LABEL[lang]} />
        </Form>
      </Formik>
    </>
  );
}

const CREATE_GAME = {
  en: 'Create a new game',
  'fr-FR': 'Créer une nouvelle partie',
};

const SELECT_GAME_LANGUAGE_LABEL = {
  en: 'Game language',
  'fr-FR': 'Langue de la partie',
};

const GAME_TITLE_LABEL = {
  en: 'Game title',
  'fr-FR': 'Titre de la partie',
};

const GAME_MAX_PLAYERS_LABEL = {
  en: 'Maximum number of players',
  'fr-FR': 'Nombre maximum de joueurs',
};

const GAME_ORGANIZER_NAME_LABEL = {
  en: 'Choose a nickname for the game',
  'fr-FR': 'Choisis un pseudo pour cette partie',
};

const CREATE_GAME_SUBMIT_BUTTON_LABEL = {
  en: 'Create',
  'fr-FR': 'Créer',
};
