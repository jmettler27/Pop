'use client';

import React from 'react';
import { Form, Formik } from 'formik';

import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';

import { useIntl } from 'react-intl';
import defineMessages from '@/utils/defineMessages';

import { DEFAULT_LOCALE, localeSchema } from '@/frontend/utils/locales';
import useAsyncAction from '@/frontend/hooks/async/useAsyncAction';

import { MyNumberInput, MyTextInput } from '@/frontend/components/forms/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/forms/SubmitFormButton';
import SelectRoundScorePolicy from '@/frontend/components/forms/SelectRoundScorePolicy';
import SelectLanguage from '@/frontend/components/forms/SelectLanguage';

import Game from '@/backend/models/games/Game';
import CreateGameService from '@/backend/services/create-game/CreateGameService';
import { gameTitleSchema, participantNameSchema } from '@/frontend/utils/forms/game';
import AppFooter from '@/frontend/components/AppFooter';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';

/* Validation */
import * as Yup from 'yup';
import { GameType } from '@/backend/models/games/GameType';

export const roundScorePolicySchema = () =>
  Yup.string().oneOf(Object.values(ScorePolicyType), 'Invalid round score policy.').required('Required.');

const messages = defineMessages('app.edit', {
  createGame: 'Create a new game',
  selectGameLanguageLabel: 'Game language',
  gameTitleLabel: 'Game title',
  gameMaxPlayersLabel: 'Max num. of players',
  gameOrganizerNameLabel: 'Choose a nickname for the game',
  createGameSubmitButtonLabel: 'Create',
});

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();
  const intl = useIntl();

  const [createNewGame, isSubmitting] = useAsyncAction(async (values, user) => {
    const { title, type, lang, maxPlayers, roundScorePolicy, organizerName } = values;
    const createGameService = new CreateGameService();
    const data = {
      title,
      type: GameType.ROUNDS,
      lang,
      maxPlayers,
      roundScorePolicy,
      organizerName,
      organizerId: user.id,
      organizerImage: user.image,
    };

    const gameId = await createGameService.createGame(data);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <main className="flex-1 p-8">
        <h1>{intl.formatMessage(messages.createGame)}</h1>
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
              console.error('Failed to create the game:', error);
              router.push('/');
            }
          }}
          validationSchema={validationSchema}
        >
          <Form>
            <SelectLanguage
              labels={intl.formatMessage(messages.selectGameLanguageLabel)}
              name="lang"
              validationSchema={validationSchema}
            />

            {/* <SelectGameType lang={lang} name='type' validationSchema={validationSchema} /> */}

            <MyTextInput
              label={intl.formatMessage(messages.gameTitleLabel)}
              name="title"
              type="text"
              placeholder={Game.TITLE_EXAMPLE}
              validationSchema={validationSchema}
              maxLength={Game.TITLE_MAX_LENGTH}
            />

            <MyNumberInput
              label={intl.formatMessage(messages.gameMaxPlayersLabel)}
              name="maxPlayers"
              min={Game.MIN_NUM_PLAYERS}
              max={Game.MAX_NUM_PLAYERS}
            />

            <SelectRoundScorePolicy name="roundScorePolicy" validationSchema={validationSchema} />

            <MyTextInput
              label={intl.formatMessage(messages.gameOrganizerNameLabel)}
              name="organizerName"
              type="text"
              placeholder={user.name}
              validationSchema={validationSchema}
              maxLength={Game.PARTICIPANT_NAME_MAX_LENGTH}
            />

            <br />

            <SubmitFormButton
              isSubmitting={isSubmitting}
              label={intl.formatMessage(messages.createGameSubmitButtonLabel)}
            />
          </Form>
        </Formik>
      </main>
      <AppFooter />
    </div>
  );
}
