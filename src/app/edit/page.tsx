'use client';

import { redirect, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { type Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { FormProvider, useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { type IntlShape, useIntl } from 'react-intl';
/* Validation */
import * as Yup from 'yup';

import CreateGameService from '@/backend/services/create-game/CreateGameService';
import {
  ReactHookFormNumberInput,
  ReactHookFormSelect,
  ReactHookFormSubmitButton,
  ReactHookFormTextInput,
} from '@/frontend/components/common/ReactHookFormComponents';
import { SelectItem } from '@/frontend/components/ui/select';
import { gameTitleSchema, participantNameSchema } from '@/frontend/helpers/forms/game';
import { DEFAULT_LOCALE, LOCALES, Locale, localeSchema, localeToTitle } from '@/frontend/helpers/locales';
import useAsyncAction from '@/frontend/hooks/useAsyncAction';
import defineMessages from '@/frontend/i18n/defineMessages';
import globalMessages from '@/frontend/i18n/globalMessages';
import Game, { CreateGameRoundsData } from '@/models/games/game';
import { GameType } from '@/models/games/game-type';
import { prependScorePolicyTypeWithEmoji, ScorePolicyType } from '@/models/score-policy';

const messages = defineMessages('app.edit', {
  selectGameLanguageLabel: 'Game language',
  gameTitleLabel: 'Game title',
  gameMaxPlayersLabel: 'Max num. of players',
  gameOrganizerNameLabel: 'Choose a nickname for the game',
  roundScorePolicyLabel: 'Round score policy',
  roundScorePolicyInvalid: 'Invalid round score policy',
  required: 'Required',
  maxPlayersMin: 'Must have at least {count} players',
  maxPlayersMax: 'Must have at most {count} players',
});

export const roundScorePolicySchema = (intl: IntlShape) =>
  Yup.string()
    .oneOf(Object.values(ScorePolicyType), intl.formatMessage(messages.roundScorePolicyInvalid))
    .required(intl.formatMessage(messages.required));

interface CreateGameFormValues {
  title: string;
  lang: Locale;
  maxPlayers: number;
  roundScorePolicy: ScorePolicyType | '';
  organizerName: string;
}

export default function Page() {
  const { data: session } = useSession();
  const router = useRouter();
  const intl = useIntl();

  const [createNewGame] = useAsyncAction(async (values: CreateGameFormValues, user: Session['user']) => {
    const { title, lang, maxPlayers, roundScorePolicy, organizerName } = values;
    const createGameService = new CreateGameService();
    const data: CreateGameRoundsData = {
      title,
      type: GameType.ROUNDS,
      lang: lang as Locale,
      maxPlayers,
      roundScorePolicy: roundScorePolicy as ScorePolicyType,
      organizerName,
      organizerId: user.id,
      organizerImage: user.image ?? '',
    };

    const gameId = await createGameService.createGame(data);
    router.push('/edit/' + gameId);
  });

  const validationSchema = Yup.object({
    lang: localeSchema(),
    title: gameTitleSchema(intl),
    maxPlayers: Yup.number()
      .required(intl.formatMessage(messages.required))
      .integer()
      .min(Game.MIN_NUM_PLAYERS, intl.formatMessage(messages.maxPlayersMin, { count: Game.MIN_NUM_PLAYERS }))
      .max(Game.MAX_NUM_PLAYERS, intl.formatMessage(messages.maxPlayersMax, { count: Game.MAX_NUM_PLAYERS })),
    roundScorePolicy: roundScorePolicySchema(intl),
    organizerName: participantNameSchema(intl),
  });

  const form = useForm<CreateGameFormValues>({
    resolver: yupResolver(validationSchema) as Resolver<CreateGameFormValues>,
    mode: 'onBlur',
    defaultValues: {
      lang: DEFAULT_LOCALE,
      title: '',
      maxPlayers: Game.MIN_NUM_PLAYERS,
      roundScorePolicy: '',
      organizerName: '',
    },
  });

  useEffect(() => {
    const fieldsWithErrors = Object.keys(form.formState.errors) as Array<keyof CreateGameFormValues>;
    if (fieldsWithErrors.length > 0) void form.trigger(fieldsWithErrors);
  }, [form, intl.locale]);

  // Protected route
  if (!session || !session.user) {
    redirect('/api/auth/signin');
  }
  if (session.user.isGuest) {
    redirect('/');
  }

  const user = session.user;

  return (
    <div className="flex flex-col flex-1 p-8">
      <h1 className="text-2xl font-bold md:text-3xl">{intl.formatMessage(globalMessages.createNewGame)}</h1>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(async (values: CreateGameFormValues) => {
          try {
            await createNewGame(values, user);
          } catch (error) {
            console.error('Failed to create the game:', error);
            router.push('/');
          }
        })}>
          <ReactHookFormSelect label={intl.formatMessage(messages.selectGameLanguageLabel)} name="lang" validationSchema={validationSchema}>
            <SelectItem value="">{intl.formatMessage(messages.selectGameLanguageLabel)}</SelectItem>
            {LOCALES.map((locale) => <SelectItem key={locale} value={locale}>{localeToTitle(locale)}</SelectItem>)}
          </ReactHookFormSelect>

          <ReactHookFormTextInput
            label={intl.formatMessage(messages.gameTitleLabel)}
            name="title"
            type="text"
            placeholder={Game.TITLE_EXAMPLE}
            validationSchema={validationSchema}
            maxLength={Game.TITLE_MAX_LENGTH}
          />

          <ReactHookFormNumberInput
            label={intl.formatMessage(messages.gameMaxPlayersLabel)}
            name="maxPlayers"
            min={Game.MIN_NUM_PLAYERS}
            max={Game.MAX_NUM_PLAYERS}
          />

          <ReactHookFormSelect label={intl.formatMessage(messages.roundScorePolicyLabel)} name="roundScorePolicy" validationSchema={validationSchema}>
            <SelectItem value="">{intl.formatMessage(messages.roundScorePolicyLabel)}</SelectItem>
            {Object.values(ScorePolicyType).map((policy) => <SelectItem key={policy} value={policy}>{prependScorePolicyTypeWithEmoji(policy, intl.locale as Locale)}</SelectItem>)}
          </ReactHookFormSelect>

          <ReactHookFormTextInput
            label={intl.formatMessage(messages.gameOrganizerNameLabel)}
            name="organizerName"
            type="text"
            placeholder={user.name ?? ''}
            validationSchema={validationSchema}
            maxLength={Game.PARTICIPANT_NAME_MAX_LENGTH}
          />

          <br />

          <ReactHookFormSubmitButton label={intl.formatMessage(globalMessages.create)} />
        </form>
      </FormProvider>
    </div>
  );
}
