'use client';

import { redirect, useRouter } from 'next/navigation';

import { Form, Formik } from 'formik';
import { useSession } from 'next-auth/react';
import { useIntl } from 'react-intl';
/* Validation */
import * as Yup from 'yup';

import { createGame } from '@/api';
import SelectLanguage from '@/components/common/SelectLanguage';
import SelectRoundScorePolicy from '@/components/common/SelectRoundScorePolicy';
import { MyNumberInput, MyTextInput } from '@/components/common/StyledFormComponents';
import SubmitFormButton from '@/components/common/SubmitFormButton';
import { gameTitleSchema, participantNameSchema } from '@/helpers/forms/game';
import { DEFAULT_LOCALE, Locale, localeSchema } from '@/helpers/locales';
import useAsyncAction from '@/hooks/useAsyncAction';
import defineMessages from '@/i18n/defineMessages';
import globalMessages from '@/i18n/globalMessages';
import Game from '@/models/games/game';
import { ScorePolicyType } from '@/models/score-policy';

export const roundScorePolicySchema = () =>
  Yup.string().oneOf(Object.values(ScorePolicyType), 'Invalid round score policy.').required('Required.');

const messages = defineMessages('app.edit', {
  selectGameLanguageLabel: 'Game language',
  gameTitleLabel: 'Game title',
  gameMaxPlayersLabel: 'Max num. of players',
  gameOrganizerNameLabel: 'Choose a nickname for the game',
});

interface CreateGameFormValues {
  title: string;
  lang: string;
  maxPlayers: number;
  roundScorePolicy: string;
  organizerName: string;
}

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();
  const intl = useIntl();

  const [createNewGame, isSubmitting] = useAsyncAction(async (values: CreateGameFormValues) => {
    const { title, lang, maxPlayers, roundScorePolicy, organizerName } = values;

    // The organizer identity (id + avatar) is resolved server-side from the
    // token; `organizerName` is the optional per-game nickname.
    const game = await createGame({
      title,
      lang: lang as Locale,
      maxPlayers,
      roundScorePolicy: roundScorePolicy as ScorePolicyType,
      organizerName,
    });
    router.push('/edit/' + game.id);
  });

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  if (session.user.isGuest) {
    redirect('/');
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
      <h1 className="text-2xl font-bold md:text-3xl">{intl.formatMessage(globalMessages.createNewGame)}</h1>
      <Formik
        initialValues={{
          // type: GAME_DEFAULT_TYPE,
          lang: DEFAULT_LOCALE,
          title: '',
          maxPlayers: Game.MIN_NUM_PLAYERS,
          roundScorePolicy: '',
          organizerName: '',
        }}
        onSubmit={async (values: CreateGameFormValues) => {
          try {
            await createNewGame(values);
          } catch (error) {
            console.error('Failed to create the game:', error);
            router.push('/');
          }
        }}
        validationSchema={validationSchema}
      >
        <Form>
          <SelectLanguage name="lang" validationSchema={validationSchema} />

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
