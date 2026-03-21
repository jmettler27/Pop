'use client';

import React from 'react';
import { redirect, useRouter } from 'next/navigation';

import { Form, Formik } from 'formik';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';
/* Validation */
import * as Yup from 'yup';

import Game from '@/backend/models/games/Game';
import { GameType } from '@/backend/models/games/GameType';
import { ScorePolicyType } from '@/backend/models/ScorePolicy';
import CreateGameService from '@/backend/services/create-game/CreateGameService';
import SelectLanguage from '@/frontend/components/common/SelectLanguage';
import SelectRoundScorePolicy from '@/frontend/components/common/SelectRoundScorePolicy';
import { MyNumberInput, MyTextInput } from '@/frontend/components/common/StyledFormComponents';
import SubmitFormButton from '@/frontend/components/common/SubmitFormButton';
import { gameTitleSchema, participantNameSchema } from '@/frontend/helpers/forms/game';
import { DEFAULT_LOCALE, localeSchema } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import globalMessages from '@/i18n/globalMessages';
import defineMessages from '@/utils/defineMessages';

export const roundScorePolicySchema = () =>
  Yup.string().oneOf(Object.values(ScorePolicyType), 'Invalid round score policy.').required('Required.');

const messages = defineMessages('app.edit', {
  selectGameLanguageLabel: 'Game language',
  gameTitleLabel: 'Game title',
  gameMaxPlayersLabel: 'Max num. of players',
  gameOrganizerNameLabel: 'Choose a nickname for the game',
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
    <div className="flex flex-col flex-1 p-8">
      <h1>{intl.formatMessage(globalMessages.createNewGame)}</h1>
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

          <SubmitFormButton isSubmitting={isSubmitting} label={intl.formatMessage(globalMessages.create)} />
        </Form>
      </Formik>
    </div>
  );
}
